"use server";

import { createClient } from "@/lib/supabase/server";
import { CheckoutFormData, OrderStatus } from "@/types";
import { sendOrderEmail } from "@/lib/email";

interface PlaceOrderResult {
  success: boolean;
  orderId?: string;
  error?: string;
  emailSent?: boolean;
  emailError?: string;
}

export async function placeOrder(
  formData: CheckoutFormData,
  cartItems: { product_id: string; variant_id: string | null; quantity: number; price: number }[],
  subtotal: number,
  shippingCost: number,
  total: number,
  promoCode?: string | null,
  discountAmount?: number
): Promise<PlaceOrderResult> {
  try {
    const supabase = await createClient();

    // Get current user if logged in
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const userId = user?.id || null;

    // Build shipping address object
    const shippingAddress = {
      first_name: formData.first_name,
      last_name: formData.last_name,
      address_line_1: formData.address_line_1,
      address_line_2: formData.address_line_2 || "",
      city: formData.city,
      state: formData.state,
      postal_code: formData.postal_code,
      country: "Pakistan",
    };

    // Insert order into orders table
    const { data: orderData, error: orderError } = await supabase
      .from("orders")
      .insert({
        user_id: userId,
        status: "pending" as OrderStatus,
        payment_method: "cod",
        subtotal,
        shipping_cost: shippingCost,
        total,
        shipping_address: shippingAddress,
        contact_phone: formData.phone,
        contact_email: formData.email,
        city: formData.city,
        promo_code: promoCode || null,
        discount_amount: discountAmount || 0,
      })
      .select()
      .single();

    if (orderError) {
      console.error("Supabase Order insertion error:", orderError);
      return {
        success: false,
        error: orderError.message,
      };
    }

    const orderId = orderData.id;

    // Insert order items
    const orderItemsData = cartItems.map((item) => ({
      order_id: orderId,
      product_id: item.product_id,
      variant_id: item.variant_id,
      quantity: item.quantity,
      unit_price: item.price,
    }));

    const { error: itemsError } = await supabase
      .from("order_items")
      .insert(orderItemsData);

    if (itemsError) {
      console.error("Supabase Order Items insertion error:", itemsError);
      return { success: false, error: itemsError.message };
    }

    let emailSent = false;
    let emailError: string | undefined;

    try {
      const { data: populatedItems, error: emailItemsError } = await supabase
        .from("order_items")
        .select(`
          quantity,
          unit_price,
          product:products ( name ),
          variant:product_variants ( size )
        `)
        .eq("order_id", orderId);

      if (emailItemsError) {
        console.error("Failed to load order items for email:", emailItemsError);
        emailError = emailItemsError.message;
      } else {
        const emailResult = await sendOrderEmail(orderData, populatedItems || []);
        emailSent = emailResult.success;
        if (!emailResult.success) {
          emailError = emailResult.error;
          console.error(`Order ${orderId} was placed, but email failed:`, emailResult.error);
        }
      }
    } catch (err) {
      emailError = err instanceof Error ? err.message : "Email dispatch failed";
      console.error(`Order ${orderId} was placed, but email dispatch failed:`, err);
    }

    // Deduct stock quantities for variants asynchronously
    for (const item of cartItems) {
      if (item.variant_id) {
        // Fetch current stock
        const { data: variant } = await supabase
          .from("product_variants")
          .select("stock_quantity")
          .eq("id", item.variant_id)
          .single();

        if (variant) {
          const newStock = Math.max(0, variant.stock_quantity - item.quantity);
          await supabase
            .from("product_variants")
            .update({ stock_quantity: newStock })
            .eq("id", item.variant_id);
        }
      }
    }

    return {
      success: true,
      orderId,
      emailSent,
      emailError,
    };
  } catch (err: any) {
    console.error("Checkout order action failed:", err);
    return {
      success: false,
      error: err.message || "Checkout order action failed",
    };
  }
}

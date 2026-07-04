"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { CheckoutFormData } from "@/types";
import { sendOrderEmail } from "@/lib/email";

interface PlaceOrderResult {
  success: boolean;
  orderId?: string;
  subtotal?: number;
  shippingCost?: number;
  total?: number;
  discountAmount?: number;
  error?: string;
  emailSent?: boolean;
  emailError?: string;
}

export async function placeOrder(
  formData: CheckoutFormData,
  cartItems: { product_id: string; variant_id: string | null; quantity: number; price?: number }[],
  _subtotal: number,
  _shippingCost: number,
  _total: number,
  promoCode?: string | null,
  _discountAmount?: number
): Promise<PlaceOrderResult> {
  try {
    void _discountAmount;

    const supabase = await createClient();
    const adminSupabase = createAdminClient();

    // Get current user if logged in
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const userId = user?.id || null;

    const safeCartItems = cartItems.map((item) => ({
      product_id: item.product_id,
      variant_id: item.variant_id,
      quantity: item.quantity,
    }));

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

    const { data: checkoutRows, error: orderError } = await adminSupabase.rpc(
      "create_checkout_order",
      {
        p_user_id: userId,
        p_shipping_address: shippingAddress,
        p_contact_phone: formData.phone,
        p_contact_email: formData.email,
        p_city: formData.city,
        p_items: safeCartItems,
        p_promo_code: promoCode || null,
      }
    );

    if (orderError) {
      console.error("Supabase checkout RPC error:", orderError);
      return {
        success: false,
        error: orderError.message,
      };
    }

    const checkout = Array.isArray(checkoutRows) ? checkoutRows[0] : checkoutRows;
    if (!checkout?.order_id) {
      return { success: false, error: "Checkout did not return an order ID." };
    }

    const orderId = checkout.order_id;

    let emailSent = false;
    let emailError: string | undefined;

    try {
      const [{ data: orderData, error: emailOrderError }, { data: populatedItems, error: emailItemsError }] =
        await Promise.all([
          adminSupabase
            .from("orders")
            .select("*")
            .eq("id", orderId)
            .single(),
          adminSupabase
            .from("order_items")
            .select(`
              quantity,
              unit_price,
              product:products ( name ),
              variant:product_variants ( size )
            `)
            .eq("order_id", orderId),
        ]);

      if (emailOrderError || emailItemsError) {
        const error = emailOrderError || emailItemsError;
        console.error("Failed to load order details for email:", error);
        emailError = error?.message;
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

    return {
      success: true,
      orderId,
      subtotal: Number(checkout.subtotal),
      shippingCost: Number(checkout.shipping_cost),
      total: Number(checkout.total),
      discountAmount: Number(checkout.discount_amount),
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

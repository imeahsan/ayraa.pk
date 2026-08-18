"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath, revalidateTag } from "next/cache";
import { sendOrderEmail } from "@/lib/email";

export interface PosOrderItemInput {
  product_id: string;
  variant_id: string;
  quantity: number;
  price: number;
  name?: string;
  size?: string;
}

export interface PosOrderPayload {
  order_id: string;
  customer_id?: string | null;
  payment_method: string;
  subtotal: number;
  discount_amount: number;
  total: number;
  shipping_address: any;
  contact_phone: string;
  contact_email: string;
  city: string;
  items: PosOrderItemInput[];
}

export interface PosOrderResult {
  success: boolean;
  orderId?: string;
  error?: string;
  emailSent?: boolean;
}

export async function recordPosOrder(payload: PosOrderPayload): Promise<PosOrderResult> {
  try {
    const supabase = await createClient();
    const adminSupabase = createAdminClient();

    // Verify user is authenticated admin
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Authentication required." };
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profileError || profile?.role !== "admin") {
      return { success: false, error: "Unauthorized. Admin permissions required." };
    }

    if (!payload.items || payload.items.length === 0) {
      return { success: false, error: "Cart is empty." };
    }

    // 1. Insert order into database
    const { error: orderError } = await adminSupabase.from("orders").insert({
      id: payload.order_id,
      user_id: payload.customer_id || null,
      status: "delivered", // POS sales are fulfilled immediately
      payment_method: payload.payment_method,
      subtotal: payload.subtotal,
      shipping_cost: 0,
      total: payload.total,
      discount_amount: payload.discount_amount,
      shipping_address: payload.shipping_address,
      contact_phone: payload.contact_phone,
      contact_email: payload.contact_email,
      city: payload.city,
    });

    if (orderError) {
      console.error("Failed to insert POS order:", orderError);
      return { success: false, error: orderError.message };
    }

    // 2. Insert order items
    const orderItemsPayload = payload.items.map((item) => ({
      order_id: payload.order_id,
      product_id: item.product_id,
      variant_id: item.variant_id,
      quantity: item.quantity,
      unit_price: item.price,
    }));

    const { error: itemsError } = await adminSupabase.from("order_items").insert(orderItemsPayload);
    if (itemsError) {
      console.error("Failed to insert POS order items:", itemsError);
      return { success: false, error: itemsError.message };
    }

    // 3. Decrement stock levels and update is_available on product_variants
    for (const item of payload.items) {
      if (!item.variant_id) continue;

      const { data: currentVariant, error: varError } = await adminSupabase
        .from("product_variants")
        .select("stock_quantity, is_available")
        .eq("id", item.variant_id)
        .single();

      if (!varError && currentVariant) {
        const currentQty = Number(currentVariant.stock_quantity) || 0;
        const newQty = Math.max(0, currentQty - item.quantity);
        const newIsAvailable = newQty > 0;

        const { error: updateError } = await adminSupabase
          .from("product_variants")
          .update({
            stock_quantity: newQty,
            is_available: newIsAvailable,
          })
          .eq("id", item.variant_id);

        if (updateError) {
          console.error(`Failed to update variant ${item.variant_id} stock:`, updateError);
        }
      }
    }

    // 4. Send customer email (if not dummy/default guest)
    let emailSent = false;
    if (
      payload.contact_email &&
      !payload.contact_email.includes("pos-guest@") &&
      payload.contact_email.includes("@")
    ) {
      try {
        const [{ data: orderData }, { data: populatedItems }] = await Promise.all([
          adminSupabase.from("orders").select("*").eq("id", payload.order_id).single(),
          adminSupabase
            .from("order_items")
            .select(`
              quantity,
              unit_price,
              product:products ( name ),
              variant:product_variants ( size )
            `)
            .eq("order_id", payload.order_id),
        ]);

        if (orderData) {
          const emailResult = await sendOrderEmail(orderData, populatedItems || []);
          emailSent = emailResult.success;
        }
      } catch (e) {
        console.error("Failed to send POS order email receipt:", e);
      }
    }

    // 5. Purge Next.js Cache & Revalidate Storefront
    try {
      revalidateTag("products", "max");
      revalidateTag("categories", "max");
      revalidatePath("/", "layout");
    } catch (cacheErr) {
      console.warn("Failed to revalidate cache after POS sale:", cacheErr);
    }

    return {
      success: true,
      orderId: payload.order_id,
      emailSent,
    };
  } catch (err: any) {
    console.error("recordPosOrder action threw error:", err);
    return {
      success: false,
      error: err.message || "Failed to record POS order.",
    };
  }
}

"use server";
import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { CheckoutFormData, OrderStatus } from "@/types";
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

export interface UpdateAdminOrderItemInput {
  id?: string;
  product_id: string;
  variant_id?: string | null;
  quantity: number;
  unit_price: number;
}

export interface UpdateAdminOrderInput {
  order_id: string;
  status: OrderStatus;
  shipping_address: {
    first_name: string;
    last_name: string;
    address_line_1: string;
    address_line_2?: string;
    city: string;
    state: string;
    postal_code?: string;
    country?: string;
  };
  contact_phone: string;
  contact_email: string;
  city: string;
  shipping_cost: number;
  discount_amount?: number;
  promo_code?: string | null;
  items: UpdateAdminOrderItemInput[];
}

export interface UpdateAdminOrderResult {
  success: boolean;
  error?: string;
  subtotal?: number;
  shippingCost?: number;
  discountAmount?: number;
  total?: number;
}

export async function updateAdminOrder(input: UpdateAdminOrderInput): Promise<UpdateAdminOrderResult> {
  try {
    const serverSupabase = await createClient();
    const adminSupabase = createAdminClient();

    // Verify authenticated user
    const {
      data: { user },
    } = await serverSupabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Authentication required." };
    }

    // Verify admin role
    const { data: profile } = await adminSupabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "admin") {
      return { success: false, error: "Admin authorization required." };
    }

    // Fetch existing order with items
    const { data: existingOrder, error: orderFetchErr } = await adminSupabase
      .from("orders")
      .select("*, items:order_items(*)")
      .eq("id", input.order_id)
      .single();

    if (orderFetchErr || !existingOrder) {
      return { success: false, error: "Order not found." };
    }

    if (!input.items || input.items.length === 0) {
      return { success: false, error: "An order must contain at least one item." };
    }

    for (const item of input.items) {
      if (item.quantity <= 0) {
        return { success: false, error: "Item quantity must be at least 1." };
      }
      if (item.unit_price < 0) {
        return { success: false, error: "Unit price cannot be negative." };
      }
    }

    // Recalculate totals
    const subtotal = input.items.reduce(
      (sum, item) => sum + Number(item.unit_price) * Number(item.quantity),
      0
    );
    const shippingCost = Math.max(0, Number(input.shipping_cost || 0));
    const discountAmount = Math.max(0, Number(input.discount_amount || 0));
    const total = Math.max(0, subtotal - discountAmount) + shippingCost;

    // Build clean address object
    const shippingAddress = {
      first_name: input.shipping_address.first_name.trim(),
      last_name: input.shipping_address.last_name.trim(),
      address_line_1: input.shipping_address.address_line_1.trim(),
      address_line_2: (input.shipping_address.address_line_2 || "").trim(),
      city: input.shipping_address.city.trim(),
      state: (input.shipping_address.state || "").trim(),
      postal_code: (input.shipping_address.postal_code || "").trim(),
      country: input.shipping_address.country || "Pakistan",
    };

    // Update order row
    const { error: orderUpdateErr } = await adminSupabase
      .from("orders")
      .update({
        status: input.status,
        shipping_address: shippingAddress,
        contact_phone: input.contact_phone.trim(),
        contact_email: input.contact_email.trim(),
        city: input.city.trim() || shippingAddress.city,
        subtotal,
        shipping_cost: shippingCost,
        discount_amount: discountAmount,
        promo_code: input.promo_code?.trim() || null,
        total,
      })
      .eq("id", input.order_id);

    if (orderUpdateErr) {
      return { success: false, error: orderUpdateErr.message };
    }

    // Manage order_items diff & inventory adjustments
    const existingItems = (existingOrder.items || []) as any[];
    const payloadItemIds = new Set(input.items.filter((i) => i.id).map((i) => i.id));

    // 1. Deleted items (in existing items but removed in update)
    const deletedItems = existingItems.filter((ex) => !payloadItemIds.has(ex.id));
    for (const del of deletedItems) {
      if (del.variant_id) {
        const { data: v } = await adminSupabase
          .from("product_variants")
          .select("stock_quantity")
          .eq("id", del.variant_id)
          .single();
        if (v) {
          await adminSupabase
            .from("product_variants")
            .update({ stock_quantity: (v.stock_quantity || 0) + del.quantity })
            .eq("id", del.variant_id);
        }
      }
      await adminSupabase.from("order_items").delete().eq("id", del.id);
    }

    // 2. Updated items
    const updatedItems = input.items.filter((i) => i.id);
    for (const up of updatedItems) {
      const existing = existingItems.find((e) => e.id === up.id);
      if (existing) {
        const qtyDiff = up.quantity - existing.quantity;
        const targetVariantId = up.variant_id || existing.variant_id;
        if (qtyDiff !== 0 && targetVariantId) {
          const { data: v } = await adminSupabase
            .from("product_variants")
            .select("stock_quantity")
            .eq("id", targetVariantId)
            .single();
          if (v) {
            await adminSupabase
              .from("product_variants")
              .update({ stock_quantity: Math.max(0, (v.stock_quantity || 0) - qtyDiff) })
              .eq("id", targetVariantId);
          }
        }
        await adminSupabase
          .from("order_items")
          .update({
            quantity: up.quantity,
            unit_price: up.unit_price,
            product_id: up.product_id,
            variant_id: up.variant_id || null,
          })
          .eq("id", up.id);
      }
    }

    // 3. Newly added items (without existing id)
    const insertedItems = input.items.filter((i) => !i.id);
    for (const ins of insertedItems) {
      if (ins.variant_id) {
        const { data: v } = await adminSupabase
          .from("product_variants")
          .select("stock_quantity")
          .eq("id", ins.variant_id)
          .single();
        if (v) {
          await adminSupabase
            .from("product_variants")
            .update({ stock_quantity: Math.max(0, (v.stock_quantity || 0) - ins.quantity) })
            .eq("id", ins.variant_id);
        }
      }
      await adminSupabase.from("order_items").insert({
        order_id: input.order_id,
        product_id: ins.product_id,
        variant_id: ins.variant_id || null,
        quantity: ins.quantity,
        unit_price: ins.unit_price,
      });
    }

    // Sync active forward shipment if one exists
    try {
      await adminSupabase
        .from("order_shipments")
        .update({
          cod_amount: total,
          recipient_name: `${shippingAddress.first_name} ${shippingAddress.last_name}`,
          recipient_phone: input.contact_phone.trim(),
          recipient_city: shippingAddress.city,
          recipient_address: `${shippingAddress.address_line_1}${shippingAddress.address_line_2 ? ', ' + shippingAddress.address_line_2 : ''}`,
          recipient_postal_code: shippingAddress.postal_code || null,
          updated_at: new Date().toISOString(),
        })
        .eq("order_id", input.order_id)
        .eq("shipment_direction", "forward")
        .in("shipment_status", ["draft", "booked"]);
    } catch {
      // Non-fatal if shipment sync fails
    }

    revalidatePath("/admin/orders");
    revalidatePath(`/admin/orders/${input.order_id}`);
    revalidatePath("/orders");

    return {
      success: true,
      subtotal,
      shippingCost,
      discountAmount,
      total,
    };
  } catch (err: any) {
    console.error("updateAdminOrder error:", err);
    return {
      success: false,
      error: err.message || "Failed to update order",
    };
  }
}

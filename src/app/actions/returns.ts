"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath, revalidateTag } from "next/cache";
import {
  OrderReturnItem,
  OrderReturnRequest,
  ReturnConditionStatus,
  ReturnRequestStatus,
  ReturnRequestType,
  ReturnResolutionType,
  ReturnRestockAction,
} from "@/types";

export interface CreateReturnCaseInput {
  order_id: string;
  request_type: ReturnRequestType;
  customer_name: string;
  customer_phone: string;
  customer_email?: string | null;
  reason: string;
  admin_notes?: string | null;
  items: Array<{
    order_item_id: string;
    product_id?: string | null;
    variant_id?: string | null;
    quantity: number;
    reason?: string;
    condition_status: ReturnConditionStatus;
    restock_action: ReturnRestockAction;
    refund_amount: number;
    exchange_product_id?: string | null;
    exchange_variant_id?: string | null;
    exchange_quantity?: number | null;
  }>;
}

export interface UpdateReturnCaseInput {
  id: string;
  status?: ReturnRequestStatus;
  request_type?: ReturnRequestType;
  resolution_type?: ReturnResolutionType | null;
  refund_amount?: number;
  store_credit_amount?: number;
  exchange_order_id?: string | null;
  reverse_courier_name?: string | null;
  reverse_tracking_number?: string | null;
  reverse_tracking_url?: string | null;
  condition_notes?: string | null;
  admin_notes?: string | null;
}

// ----------------------------------------------------
// 1. Create Return / Exchange Case (Admin / Ops)
// ----------------------------------------------------
export async function createReturnCase(input: CreateReturnCaseInput) {
  try {
    const adminSupabase = createAdminClient();
    const serverSupabase = await createClient();

    const {
      data: { user },
    } = await serverSupabase.auth.getUser();

    // Verify order exists
    const { data: order, error: orderError } = await adminSupabase
      .from("orders")
      .select("*, items:order_items(*)")
      .eq("id", input.order_id)
      .single();

    if (orderError || !order) {
      return { success: false, error: "Order not found." };
    }

    if (!input.items || input.items.length === 0) {
      return { success: false, error: "At least one order item must be selected." };
    }

    const totalRefund =
      input.request_type === "exchange"
        ? 0
        : input.items.reduce((sum, it) => sum + Number(it.refund_amount || 0), 0);

    // Insert return request record
    const { data: requestData, error: requestError } = await adminSupabase
      .from("order_return_requests")
      .insert({
        order_id: input.order_id,
        request_type: input.request_type,
        status: "requested",
        customer_name: input.customer_name.trim(),
        customer_phone: input.customer_phone.trim(),
        customer_email: input.customer_email?.trim() || null,
        reason: input.reason.trim(),
        admin_notes: input.admin_notes?.trim() || null,
        refund_amount: totalRefund,
        created_by: user?.id || null,
        updated_by: user?.id || null,
      })
      .select()
      .single();

    if (requestError || !requestData) {
      throw new Error(requestError?.message || "Failed to create return request.");
    }

    // Prepare line items
    const returnItems = input.items.map((line) => ({
      return_request_id: requestData.id,
      order_item_id: line.order_item_id,
      product_id: line.product_id || null,
      variant_id: line.variant_id || null,
      quantity: line.quantity,
      reason: line.reason?.trim() || null,
      condition_status: line.condition_status,
      restock_action: line.restock_action,
      refund_amount: input.request_type === "exchange" ? 0 : Number(line.refund_amount || 0),
      exchange_product_id: line.exchange_product_id || null,
      exchange_variant_id: line.exchange_variant_id || null,
      exchange_quantity: line.exchange_quantity || null,
    }));

    const { error: itemsError } = await adminSupabase
      .from("order_return_items")
      .insert(returnItems);

    if (itemsError) {
      // Rollback
      await adminSupabase.from("order_return_requests").delete().eq("id", requestData.id);
      throw new Error(itemsError.message);
    }

    // Add note to parent order audit log
    try {
      await adminSupabase.from("order_notes").insert({
        order_id: input.order_id,
        admin_user_id: user?.id || "00000000-0000-0000-0000-000000000000",
        note: `Return/Exchange Case #${requestData.id.slice(0, 8)} created (${input.request_type.toUpperCase()}). Reason: ${input.reason}`,
      });
    } catch (noteErr) {
      console.warn("Failed to log order note for return creation:", noteErr);
    }

    revalidatePath("/admin/returns");
    revalidatePath(`/admin/orders/${input.order_id}`);

    return {
      success: true,
      returnId: requestData.id,
    };
  } catch (err: any) {
    console.error("createReturnCase error:", err);
    return {
      success: false,
      error: err.message || "Failed to create return case.",
    };
  }
}

// ----------------------------------------------------
// 2. Update Return Case (Status, Resolution, Reverse Tracking)
// ----------------------------------------------------
export async function updateReturnCase(input: UpdateReturnCaseInput) {
  try {
    const adminSupabase = createAdminClient();
    const serverSupabase = await createClient();

    const {
      data: { user },
    } = await serverSupabase.auth.getUser();

    // Fetch existing case
    const { data: existing, error: fetchError } = await adminSupabase
      .from("order_return_requests")
      .select("*")
      .eq("id", input.id)
      .single();

    if (fetchError || !existing) {
      return { success: false, error: "Return case not found." };
    }

    const now = new Date().toISOString();
    const patch: Record<string, any> = {
      updated_at: now,
      updated_by: user?.id || null,
    };

    if (input.status !== undefined) {
      patch.status = input.status;
      if (input.status === "approved" && !existing.approved_at) patch.approved_at = now;
      if (input.status === "received" && !existing.received_at) patch.received_at = now;
      if (input.status === "resolved" && !existing.resolved_at) patch.resolved_at = now;
    }

    if (input.request_type !== undefined) patch.request_type = input.request_type;
    if (input.resolution_type !== undefined) patch.resolution_type = input.resolution_type || null;
    if (input.refund_amount !== undefined) patch.refund_amount = input.refund_amount;
    if (input.store_credit_amount !== undefined) patch.store_credit_amount = input.store_credit_amount;
    if (input.exchange_order_id !== undefined) patch.exchange_order_id = input.exchange_order_id?.trim() || null;
    if (input.reverse_courier_name !== undefined) patch.reverse_courier_name = input.reverse_courier_name?.trim() || null;
    if (input.reverse_tracking_number !== undefined) patch.reverse_tracking_number = input.reverse_tracking_number?.trim() || null;
    if (input.reverse_tracking_url !== undefined) patch.reverse_tracking_url = input.reverse_tracking_url?.trim() || null;
    if (input.condition_notes !== undefined) patch.condition_notes = input.condition_notes?.trim() || null;
    if (input.admin_notes !== undefined) patch.admin_notes = input.admin_notes?.trim() || null;

    const { error: updateError } = await adminSupabase
      .from("order_return_requests")
      .update(patch)
      .eq("id", input.id);

    if (updateError) throw new Error(updateError.message);

    // If case is resolved and order status should reflect it
    if (input.status === "resolved" && input.resolution_type === "refund") {
      try {
        await adminSupabase.from("order_notes").insert({
          order_id: existing.order_id,
          admin_user_id: user?.id || "00000000-0000-0000-0000-000000000000",
          note: `Return #${input.id.slice(0, 8)} marked RESOLVED with Refund PKR ${input.refund_amount ?? existing.refund_amount}.`,
        });
      } catch (noteErr) {
        console.warn("Failed to log order note:", noteErr);
      }
    }

    revalidatePath("/admin/returns");
    revalidatePath(`/admin/returns/${input.id}`);
    revalidatePath(`/admin/orders/${existing.order_id}`);

    return { success: true };
  } catch (err: any) {
    console.error("updateReturnCase error:", err);
    return { success: false, error: err.message || "Failed to update return case." };
  }
}

// ----------------------------------------------------
// 3. Update Return Item (Condition, Restock Action)
// ----------------------------------------------------
export async function updateReturnItem(
  itemId: string,
  data: {
    condition_status?: ReturnConditionStatus;
    restock_action?: ReturnRestockAction;
    refund_amount?: number;
    reason?: string;
  }
) {
  try {
    const adminSupabase = createAdminClient();
    const { error } = await adminSupabase
      .from("order_return_items")
      .update(data)
      .eq("id", itemId);

    if (error) throw new Error(error.message);
    return { success: true };
  } catch (err: any) {
    console.error("Failed to update return item:", err);
    return { success: false, error: err.message || "Failed to update return item." };
  }
}

// ----------------------------------------------------
// 4. Batch Update Return Items
// ----------------------------------------------------
export async function batchUpdateReturnItems(
  returnRequestId: string,
  restockAction: ReturnRestockAction
) {
  try {
    const adminSupabase = createAdminClient();
    const { error } = await adminSupabase
      .from("order_return_items")
      .update({ restock_action: restockAction })
      .eq("return_request_id", returnRequestId);

    if (error) throw new Error(error.message);
    return { success: true };
  } catch (err: any) {
    console.error("Failed to batch update return items:", err);
    return { success: false, error: err.message || "Failed to batch update return items." };
  }
}

// ----------------------------------------------------
// 5. Restock Return Items (SAFE & IDEMPOTENT)
// ----------------------------------------------------
export async function restockReturnItems(
  returnRequestId: string,
  specificItemIds?: string[]
) {
  try {
    const adminSupabase = createAdminClient();

    // Query items for this return request
    let query = adminSupabase
      .from("order_return_items")
      .select("id, variant_id, quantity, restock_action, reason, condition_status")
      .eq("return_request_id", returnRequestId)
      .eq("restock_action", "restock")
      .not("variant_id", "is", null);

    if (specificItemIds && specificItemIds.length > 0) {
      query = query.in("id", specificItemIds);
    }

    const { data: items, error: fetchError } = await query;
    if (fetchError) throw new Error(fetchError.message);

    if (!items || items.length === 0) {
      return {
        success: false,
        error: "No variant items are marked for restock. Set 'Restock' on items first.",
      };
    }

    // Filter out items that have already been restocked
    const unRestockedItems = items.filter(
      (item) => !(item.reason && item.reason.includes("[RESTOCKED:"))
    );

    if (unRestockedItems.length === 0) {
      return {
        success: true,
        restockedCount: 0,
        alreadyRestocked: true,
        message: "All selected items have already been restocked previously.",
      };
    }

    let restockedCount = 0;
    const nowIso = new Date().toISOString();

    for (const item of unRestockedItems) {
      if (!item.variant_id) continue;

      // Fetch current variant stock
      const { data: variant, error: variantError } = await adminSupabase
        .from("product_variants")
        .select("id, stock_quantity, is_available")
        .eq("id", item.variant_id)
        .single();

      if (variantError || !variant) {
        console.warn(`Variant ${item.variant_id} not found, skipping restock.`);
        continue;
      }

      const currentQty = Number(variant.stock_quantity || 0);
      const addQty = Number(item.quantity || 1);
      const newQty = currentQty + addQty;

      // Increment stock and make available
      const { error: updateError } = await adminSupabase
        .from("product_variants")
        .update({
          stock_quantity: newQty,
          is_available: true,
        })
        .eq("id", item.variant_id);

      if (updateError) {
        console.error(`Failed to restock variant ${item.variant_id}:`, updateError);
        continue;
      }

      // Mark item with restock stamp to guarantee idempotency
      const stamp = `[RESTOCKED: ${nowIso} | +${addQty} qty]`;
      const updatedReason = item.reason ? `${item.reason} ${stamp}` : stamp;

      await adminSupabase
        .from("order_return_items")
        .update({ reason: updatedReason })
        .eq("id", item.id);

      restockedCount++;
    }

    // Purge caches immediately
    try {
      revalidateTag("products", "max");
      revalidateTag("categories", "max");
      revalidatePath("/", "layout");
      revalidatePath("/admin/inventory");
      revalidatePath("/admin/products");
      revalidatePath(`/admin/returns/${returnRequestId}`);
    } catch (cacheErr) {
      console.warn("Cache revalidation in restockReturnItems:", cacheErr);
    }

    return {
      success: true,
      restockedCount,
    };
  } catch (err: any) {
    console.error("restockReturnItems error:", err);
    return { success: false, error: err.message || "Failed to restock items." };
  }
}

// ----------------------------------------------------
// 6. Generate Automated Exchange Order
// ----------------------------------------------------
export async function createExchangeOrderAction(
  returnRequestId: string,
  exchangeItems: Array<{
    product_id: string;
    variant_id: string | null;
    quantity: number;
    unit_price: number;
  }>,
  shippingCost = 0
) {
  try {
    const adminSupabase = createAdminClient();
    const serverSupabase = await createClient();

    const {
      data: { user },
    } = await serverSupabase.auth.getUser();

    // Fetch return request with original order
    const { data: request, error: reqError } = await adminSupabase
      .from("order_return_requests")
      .select("*, order:orders!order_return_requests_order_id_fkey(*)")
      .eq("id", returnRequestId)
      .single();

    if (reqError || !request || !request.order) {
      return { success: false, error: "Return request or original order not found." };
    }

    if (!exchangeItems || exchangeItems.length === 0) {
      return { success: false, error: "Please specify at least one replacement item." };
    }

    const originalOrder = request.order;
    const subtotal = exchangeItems.reduce(
      (sum, it) => sum + Number(it.unit_price) * Number(it.quantity),
      0
    );
    const total = subtotal + shippingCost;

    // Create exchange order
    const newOrderId = `EXC-${Math.floor(100000 + Math.random() * 900000)}`;

    const { data: newOrder, error: newOrderError } = await adminSupabase
      .from("orders")
      .insert({
        id: newOrderId,
        user_id: originalOrder.user_id || null,
        status: "processing",
        payment_method: "cod",
        subtotal,
        shipping_cost: shippingCost,
        total,
        shipping_address: originalOrder.shipping_address,
        contact_phone: request.customer_phone || originalOrder.contact_phone,
        contact_email: request.customer_email || originalOrder.contact_email,
        city: originalOrder.city,
      })
      .select()
      .single();

    if (newOrderError || !newOrder) {
      throw new Error(newOrderError?.message || "Failed to create exchange order.");
    }

    // Insert exchange order items
    const orderItems = exchangeItems.map((item) => ({
      order_id: newOrder.id,
      product_id: item.product_id,
      variant_id: item.variant_id,
      quantity: item.quantity,
      unit_price: item.unit_price,
    }));

    const { error: itemsError } = await adminSupabase.from("order_items").insert(orderItems);
    if (itemsError) {
      await adminSupabase.from("orders").delete().eq("id", newOrder.id);
      throw new Error(`Failed to create exchange items: ${itemsError.message}`);
    }

    // Link exchange order to return request
    await adminSupabase
      .from("order_return_requests")
      .update({
        exchange_order_id: newOrder.id,
        resolution_type: "exchange_order",
        updated_at: new Date().toISOString(),
        updated_by: user?.id || null,
      })
      .eq("id", returnRequestId);

    // Add note to both orders
    try {
      await adminSupabase.from("order_notes").insert([
        {
          order_id: originalOrder.id,
          admin_user_id: user?.id || "00000000-0000-0000-0000-000000000000",
          note: `Exchange Order #${newOrder.id} generated from Return Case #${request.id.slice(0, 8)}.`,
        },
        {
          order_id: newOrder.id,
          admin_user_id: user?.id || "00000000-0000-0000-0000-000000000000",
          note: `Exchange replacement order for original Order #${originalOrder.id} (Return Case #${request.id.slice(0, 8)}).`,
        },
      ]);
    } catch (noteErr) {
      console.warn("Failed to create exchange order notes:", noteErr);
    }

    revalidatePath("/admin/returns");
    revalidatePath(`/admin/returns/${returnRequestId}`);
    revalidatePath(`/admin/orders/${originalOrder.id}`);
    revalidatePath(`/admin/orders/${newOrder.id}`);

    return {
      success: true,
      exchangeOrderId: newOrder.id,
    };
  } catch (err: any) {
    console.error("createExchangeOrderAction error:", err);
    return { success: false, error: err.message || "Failed to create exchange order." };
  }
}

// ----------------------------------------------------
// 7. Customer Portal: Request Return / Exchange
// ----------------------------------------------------
export async function requestCustomerReturn(input: {
  order_id: string;
  request_type: ReturnRequestType;
  reason: string;
  notes?: string;
  items: Array<{
    order_item_id: string;
    quantity: number;
    reason?: string;
  }>;
}) {
  try {
    const serverSupabase = await createClient();
    const adminSupabase = createAdminClient();

    const {
      data: { user },
    } = await serverSupabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Please log in to request a return or exchange." };
    }

    // Verify order belongs to user and is delivered
    const { data: order, error: orderErr } = await adminSupabase
      .from("orders")
      .select("*, items:order_items(*)")
      .eq("id", input.order_id)
      .single();

    if (orderErr || !order) {
      return { success: false, error: "Order not found." };
    }

    if (order.user_id !== user.id) {
      return { success: false, error: "Unauthorized: This order does not belong to your account." };
    }

    if (order.status !== "delivered") {
      return {
        success: false,
        error: "Only delivered orders are eligible for return or exchange.",
      };
    }

    const customerName = `${order.shipping_address?.first_name || ""} ${order.shipping_address?.last_name || ""}`.trim() || user.email || "Customer";

    // Create case in requested status
    const { data: requestData, error: reqError } = await adminSupabase
      .from("order_return_requests")
      .insert({
        order_id: input.order_id,
        request_type: input.request_type,
        status: "requested",
        customer_name: customerName,
        customer_phone: order.contact_phone,
        customer_email: order.contact_email || user.email,
        reason: input.reason.trim(),
        condition_notes: input.notes?.trim() || null,
        created_by: user.id,
      })
      .select()
      .single();

    if (reqError || !requestData) {
      throw new Error(reqError?.message || "Failed to submit return request.");
    }

    // Insert items
    const returnItems = input.items.map((line) => {
      const orderItem = (order.items || []).find((it: any) => it.id === line.order_item_id);
      const refundAmt = orderItem ? Number(orderItem.unit_price) * line.quantity : 0;

      return {
        return_request_id: requestData.id,
        order_item_id: line.order_item_id,
        product_id: orderItem?.product_id || null,
        variant_id: orderItem?.variant_id || null,
        quantity: line.quantity,
        reason: line.reason?.trim() || input.reason.trim(),
        condition_status: "unused" as ReturnConditionStatus,
        restock_action: "inspect_later" as ReturnRestockAction,
        refund_amount: input.request_type === "exchange" ? 0 : refundAmt,
      };
    });

    const { error: itemsError } = await adminSupabase.from("order_return_items").insert(returnItems);
    if (itemsError) {
      await adminSupabase.from("order_return_requests").delete().eq("id", requestData.id);
      throw new Error(itemsError.message);
    }

    revalidatePath("/orders");
    revalidatePath("/admin/returns");

    return {
      success: true,
      returnId: requestData.id,
    };
  } catch (err: any) {
    console.error("requestCustomerReturn error:", err);
    return { success: false, error: err.message || "Failed to submit return request." };
  }
}

// ----------------------------------------------------
// 8. Get Return Requests for Order
// ----------------------------------------------------
export async function getOrderReturns(orderId: string) {
  try {
    const adminSupabase = createAdminClient();
    const { data, error } = await adminSupabase
      .from("order_return_requests")
      .select("*, items:order_return_items(*)")
      .eq("order_id", orderId)
      .order("created_at", { ascending: false });

    if (error) throw new Error(error.message);
    return { success: true, returns: (data || []) as OrderReturnRequest[] };
  } catch (err: any) {
    console.error("getOrderReturns error:", err);
    return { success: false, error: err.message, returns: [] };
  }
}

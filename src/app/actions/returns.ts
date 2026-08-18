"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath, revalidateTag } from "next/cache";
import { ReturnConditionStatus, ReturnRestockAction } from "@/types";

export async function updateReturnItem(
  itemId: string,
  data: {
    condition_status?: ReturnConditionStatus;
    restock_action?: ReturnRestockAction;
    refund_amount?: number;
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
    return { success: false, error: err.message || "Failed to update return item" };
  }
}

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
    return { success: false, error: err.message || "Failed to batch update return items" };
  }
}

export async function restockReturnItems(
  returnRequestId: string,
  specificItemIds?: string[]
) {
  try {
    const adminSupabase = createAdminClient();

    // Query items for this return request
    let query = adminSupabase
      .from("order_return_items")
      .select("id, variant_id, quantity, restock_action")
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
        error: "No variant items are marked for restock. Set 'Restock' in the item dropdown first.",
      };
    }

    let restockedCount = 0;

    for (const item of items) {
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
      const newQty = currentQty + Number(item.quantity || 1);

      // Increment stock and ensure is_available is true
      const { error: updateError } = await adminSupabase
        .from("product_variants")
        .update({
          stock_quantity: newQty,
          is_available: newQty > 0,
        })
        .eq("id", item.variant_id);

      if (updateError) {
        console.error(`Failed to restock variant ${item.variant_id}:`, updateError);
        continue;
      }

      restockedCount++;
    }

    // Purge caches immediately
    try {
      revalidateTag("products", "max");
      revalidateTag("categories", "max");
      revalidatePath("/", "layout");
      revalidatePath("/admin/inventory");
      revalidatePath("/admin/products");
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

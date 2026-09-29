"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath, revalidateTag } from "next/cache";

export interface ProductSaleUpdate {
  id: string;
  price: number;
  compare_at_price: number | null;
  is_on_sale: boolean;
  is_active: boolean;
}

export async function saveSalesSettings(updates: ProductSaleUpdate[]) {
  if (!updates || updates.length === 0) {
    return { success: true, count: 0 };
  }

  try {
    const adminSupabase = createAdminClient();

    // Perform updates using service role
    const updatePromises = updates.map(async (u) => {
      const { data, error } = await adminSupabase
        .from("products")
        .update({
          price: u.price,
          compare_at_price: u.compare_at_price,
          is_on_sale: u.is_on_sale,
          is_active: u.is_active,
        })
        .eq("id", u.id)
        .select("id");

      if (error) {
        throw new Error(`Failed to update product ${u.id}: ${error.message}`);
      }
      return data;
    });

    const results = await Promise.all(updatePromises);
    const updatedCount = results.filter((r) => r && r.length > 0).length;

    // Purge Next.js caches immediately across storefront
    try {
      revalidateTag("products", "max");
      revalidateTag("categories", "max");
      revalidatePath("/", "layout");
      revalidatePath("/collections", "layout");
      revalidatePath("/collections/[slug]", "page");
      revalidatePath("/product/[slug]", "page");
    } catch (cacheErr) {
      console.warn("Revalidation warning in saveSalesSettings:", cacheErr);
    }

    return {
      success: true,
      count: updatedCount,
    };
  } catch (err: any) {
    console.error("Failed to save sales settings:", err);
    return {
      success: false,
      error: err.message || "Failed to update products in database.",
    };
  }
}

/**
 * Syncs any existing products where compare_at_price > price to ensure is_on_sale = true
 */
export async function syncExistingSaleProducts() {
  try {
    const adminSupabase = createAdminClient();
    const { data: prods, error: fetchErr } = await adminSupabase
      .from("products")
      .select("id, price, compare_at_price, is_on_sale")
      .not("compare_at_price", "is", null);

    if (fetchErr) throw fetchErr;

    const toUpdate = (prods || []).filter(
      (p) => p.compare_at_price && p.compare_at_price > p.price && !p.is_on_sale
    );

    if (toUpdate.length === 0) {
      return { success: true, count: 0 };
    }

    const updatePromises = toUpdate.map((p) =>
      adminSupabase.from("products").update({ is_on_sale: true }).eq("id", p.id)
    );

    await Promise.all(updatePromises);

    try {
      revalidateTag("products", "max");
      revalidatePath("/", "layout");
    } catch (e) {}

    return { success: true, count: toUpdate.length };
  } catch (err: any) {
    console.error("Failed to sync sale products:", err);
    return { success: false, error: err.message };
  }
}

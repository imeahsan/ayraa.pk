import { unstable_cache } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import { createCacheClient } from "@/lib/supabase/cache-client";

const getCachedProductsPage = unstable_cache(
  async (page: number, limit: number) => {
    const supabase = createCacheClient();
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data, error } = await supabase
      .from("products")
      .select("*, category:categories(*), images:product_images(*), variants:product_variants(*)")
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) {
      throw error;
    }

    return data || [];
  },
  ["storefront-products-page"],
  { revalidate: 300, tags: ["products", "categories"] }
);

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const pageParam = Number(searchParams.get("page") || "1");
  const limitParam = Number(searchParams.get("limit") || "12");
  const page = Number.isFinite(pageParam) && pageParam > 0 ? Math.floor(pageParam) : 1;
  const limit = Number.isFinite(limitParam) && limitParam > 0 && limitParam <= 24 ? Math.floor(limitParam) : 12;
  const data = await getCachedProductsPage(page, limit);

  return NextResponse.json(data, {
    headers: {
      "Cache-Control": "public, s-maxage=300, stale-while-revalidate=86400",
    },
  });
}

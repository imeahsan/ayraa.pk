import { unstable_cache } from "next/cache";
import { NextResponse } from "next/server";
import { createCacheClient } from "@/lib/supabase/cache-client";

const getCachedNavigationCategories = unstable_cache(
  async () => {
    const supabase = createCacheClient();
    const { data, error } = await supabase
      .from("categories")
      .select("id, name, slug, parent_id, header_label, show_in_header, is_active, sort_order")
      .eq("is_active", true)
      .order("sort_order", { ascending: true });

    if (error) {
      throw error;
    }

    return data || [];
  },
  ["storefront-navigation-categories"],
  { revalidate: 300, tags: ["categories"] }
);

export async function GET() {
  const data = await getCachedNavigationCategories();

  return NextResponse.json(data, {
    headers: {
      "Cache-Control": "public, s-maxage=300, stale-while-revalidate=86400",
    },
  });
}

import { unstable_cache } from "next/cache";
import { NextResponse } from "next/server";
import { createCacheClient } from "@/lib/supabase/cache-client";

const getCachedTickerMessages = unstable_cache(
  async () => {
    const supabase = createCacheClient();
    const { data, error } = await supabase
      .from("ticker_announcements")
      .select("message")
      .eq("is_active", true)
      .order("sort_order", { ascending: true });

    if (error) {
      throw error;
    }

    return (data || []).map((item) => item.message);
  },
  ["storefront-ticker-messages"],
  { revalidate: 300, tags: ["ticker"] }
);

export async function GET() {
  const data = await getCachedTickerMessages();

  return NextResponse.json(data, {
    headers: {
      "Cache-Control": "public, s-maxage=300, stale-while-revalidate=86400",
    },
  });
}

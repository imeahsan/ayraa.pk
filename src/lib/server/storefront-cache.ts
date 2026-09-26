import { unstable_cache } from "next/cache";
import { createCacheClient } from "@/lib/supabase/cache-client";

export interface NavigationCategory {
  id: string;
  name: string;
  slug: string;
  parent_id: string | null;
  header_label?: string | null;
  show_in_header?: boolean | null;
  is_active: boolean;
  sort_order?: number | null;
}

export const getCachedNavigationCategories = unstable_cache(
  async (): Promise<NavigationCategory[]> => {
    const supabase = createCacheClient();
    const { data, error } = await supabase
      .from("categories")
      .select("id, name, slug, parent_id, header_label, show_in_header, is_active, sort_order")
      .eq("is_active", true)
      .order("sort_order", { ascending: true });

    if (error) {
      throw error;
    }

    return (data || []) as NavigationCategory[];
  },
  ["storefront-navigation-categories"],
  { revalidate: 300, tags: ["categories"] }
);

export const getCachedTickerMessages = unstable_cache(
  async (): Promise<string[]> => {
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

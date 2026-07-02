import { MetadataRoute } from "next";
import { createClient } from "@supabase/supabase-js";
import { getSiteUrl } from "@/lib/seo";

export const revalidate = 0;
export const dynamic = "force-dynamic";

type ProductSitemapRow = {
  slug: string;
  created_at?: string | null;
};

type CategorySitemapRow = {
  slug: string;
  created_at?: string | null;
};

type StaticSitemapRoute = {
  path: string;
  priority: number;
  changeFrequency: NonNullable<MetadataRoute.Sitemap[number]["changeFrequency"]>;
};

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getSiteUrl();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const now = new Date();

  let productsList: ProductSitemapRow[] = [];
  let categoriesList: CategorySitemapRow[] = [];

  if (supabaseUrl && supabaseAnonKey) {
    try {
      const supabase = createClient(supabaseUrl, supabaseAnonKey);

      const [productsRes, categoriesRes] = await Promise.all([
        supabase
          .from("products")
          .select("slug, created_at")
          .eq("is_active", true)
          .order("created_at", { ascending: false }),
        supabase
          .from("categories")
          .select("slug, created_at")
          .eq("is_active", true)
          .order("sort_order", { ascending: true }),
      ]);

      if (productsRes.data) productsList = productsRes.data;
      if (categoriesRes.data) categoriesList = categoriesRes.data;
    } catch (e) {
      console.error("Failed to fetch sitemap data:", e);
    }
  }

  const staticRouteDefinitions: StaticSitemapRoute[] = [
    { path: "/", priority: 1.0, changeFrequency: "daily" },
    { path: "/collections", priority: 0.9, changeFrequency: "daily" },
    { path: "/about", priority: 0.6, changeFrequency: "monthly" },
    { path: "/contact", priority: 0.5, changeFrequency: "monthly" },
    { path: "/shipping-returns", priority: 0.4, changeFrequency: "monthly" },
    { path: "/returns-policy", priority: 0.4, changeFrequency: "monthly" },
    { path: "/size-guide", priority: 0.5, changeFrequency: "monthly" },
    { path: "/faq", priority: 0.5, changeFrequency: "monthly" },
    { path: "/editorial", priority: 0.4, changeFrequency: "weekly" },
    { path: "/terms-privacy", priority: 0.2, changeFrequency: "yearly" },
    { path: "/careers", priority: 0.2, changeFrequency: "monthly" },
  ];

  const staticRoutes: MetadataRoute.Sitemap = staticRouteDefinitions.map((route) => ({
    url: `${baseUrl}${route.path}`,
    lastModified: now,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));

  const categoryRoutes: MetadataRoute.Sitemap = categoriesList.map((cat) => ({
    url: `${baseUrl}/collections/${cat.slug}`,
    lastModified: cat.created_at ? new Date(cat.created_at) : now,
    changeFrequency: "daily",
    priority: 0.8,
  }));

  const productRoutes: MetadataRoute.Sitemap = productsList.map((prod) => ({
    url: `${baseUrl}/product/${prod.slug}`,
    lastModified: prod.created_at ? new Date(prod.created_at) : now,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  return [...staticRoutes, ...categoryRoutes, ...productRoutes];
}

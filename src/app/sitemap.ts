import { MetadataRoute } from "next";
import { createClient } from "@supabase/supabase-js";

export const revalidate = 86400; // Cache sitemap for 24 hours (1 day)

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://ayraacollection.vercel.app";

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  let productsList: any[] = [];
  let categoriesList: any[] = [];

  if (supabaseUrl && supabaseAnonKey) {
    try {
      const supabase = createClient(supabaseUrl, supabaseAnonKey);
      
      const [productsRes, categoriesRes] = await Promise.all([
        supabase
          .from("products")
          .select("slug, created_at")
          .eq("is_active", true),
        supabase
          .from("categories")
          .select("slug")
          .eq("is_active", true)
      ]);

      if (productsRes.data) productsList = productsRes.data;
      if (categoriesRes.data) categoriesList = categoriesRes.data;
    } catch (e) {
      console.error("Failed to fetch sitemap data:", e);
    }
  }

  // Base static routes
  const staticRoutes = [
    "",
    "/collections",
    "/about",
    "/contact",
    "/cart",
    "/login",
    "/register",
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: route === "" ? 1.0 : 0.8,
  }));

  // Dynamic category routes
  const categoryRoutes = categoriesList.map((cat) => ({
    url: `${baseUrl}/collections/${cat.slug}`,
    lastModified: new Date(),
    changeFrequency: "daily" as const,
    priority: 0.9,
  }));

  // If DB call failed, fallback categories
  const fallbackCategories = categoriesList.length === 0 ? [
    "lawn-prints", "lawn-3-piece", "lawn-2-piece", "lawn-ready-to-wear",
    "garments", "intimate-wear", "sleep-wear",
    "bedding", "single-bedsheets", "double-bedsheets",
    "hijab-collection", "chiffon-hijabs", "printed-hijabs",
  ].map((slug) => ({
    url: `${baseUrl}/collections/${slug}`,
    lastModified: new Date(),
    changeFrequency: "daily" as const,
    priority: 0.9,
  })) : [];

  // Dynamic product routes
  const productRoutes = productsList.map((prod) => ({
    url: `${baseUrl}/product/${prod.slug}`,
    lastModified: prod.created_at ? new Date(prod.created_at) : new Date(),
    changeFrequency: "daily" as const,
    priority: 0.8,
  }));

  return [
    ...staticRoutes,
    ...categoryRoutes,
    ...fallbackCategories,
    ...productRoutes,
  ];
}


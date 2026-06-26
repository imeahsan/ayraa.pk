import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = "https://ayraacollection.vercel.app";

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/admin/",
        "/checkout/",
        "/cart",
        "/wishlist",
        "/login",
        "/register"
      ],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}

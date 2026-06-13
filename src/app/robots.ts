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
        "/login",
        "/register"
      ],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}


import { NextResponse } from "next/server";
import { getCachedNavigationCategories } from "@/lib/server/storefront-cache";

export async function GET() {
  const data = await getCachedNavigationCategories();

  return NextResponse.json(data, {
    headers: {
      "Cache-Control": "public, s-maxage=300, stale-while-revalidate=86400",
    },
  });
}

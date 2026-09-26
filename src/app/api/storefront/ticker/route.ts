import { NextResponse } from "next/server";
import { getCachedTickerMessages } from "@/lib/server/storefront-cache";

export async function GET() {
  const data = await getCachedTickerMessages();

  return NextResponse.json(data, {
    headers: {
      "Cache-Control": "public, s-maxage=300, stale-while-revalidate=86400",
    },
  });
}

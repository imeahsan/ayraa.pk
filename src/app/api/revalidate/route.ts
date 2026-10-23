import { NextRequest, NextResponse } from "next/server";
import { revalidateTag, revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

async function handleRevalidation(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const tag = searchParams.get("tag");
  const path = searchParams.get("path");
  const secret = searchParams.get("secret") || request.headers.get("x-revalidate-secret");

  const secretToken = process.env.REVALIDATE_SECRET_TOKEN || process.env.REVALIDATION_SECRET;
  let isAuthorized = false;

  // 1. Check secret token if provided or configured
  if (secretToken && secret === secretToken) {
    isAuthorized = true;
  } else {
    // 2. Allow logged-in admin session
    try {
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        isAuthorized = true;
      }
    } catch {
      isAuthorized = false;
    }
  }

  // Reject unauthorized calls if secret is configured or no user is logged in
  if (!isAuthorized && secretToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 3. Targeted tag revalidation (never nuke the entire layout)
  if (tag) {
    revalidateTag(tag);
    if (tag === "products" || tag === "categories") {
      revalidatePath("/");
      revalidatePath("/collections");
    }
  }

  // 4. Targeted path revalidation
  if (path) {
    revalidatePath(path);
  }

  return NextResponse.json({
    revalidated: true,
    tag: tag || null,
    path: path || null,
    now: Date.now(),
  });
}

export async function GET(request: NextRequest) {
  return handleRevalidation(request);
}

export async function POST(request: NextRequest) {
  return handleRevalidation(request);
}

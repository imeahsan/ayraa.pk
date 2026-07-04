import { NextRequest, NextResponse } from "next/server";

import {
  createBypassCookieValue,
  getBypassCookieName,
  isValidBypassKey,
} from "@/lib/access-bypass";

function getSafeRedirectPath(request: NextRequest) {
  const redirectParam = request.nextUrl.searchParams.get("redirect");
  if (!redirectParam || !redirectParam.startsWith("/")) {
    return "/";
  }

  return redirectParam;
}

export async function GET(request: NextRequest) {
  const shouldClear = request.nextUrl.searchParams.get("clear") === "1";
  const redirectPath = getSafeRedirectPath(request);

  if (shouldClear) {
    const response = NextResponse.redirect(new URL(redirectPath, request.url));
    response.cookies.delete(getBypassCookieName());
    return response;
  }

  const key = request.nextUrl.searchParams.get("key");
  if (!isValidBypassKey(key)) {
    return NextResponse.json({ error: "Invalid access key." }, { status: 403 });
  }

  const cookieValue = await createBypassCookieValue();
  if (!cookieValue) {
    return NextResponse.json({ error: "Access bypass is not configured." }, { status: 500 });
  }

  const response = NextResponse.redirect(new URL(redirectPath, request.url));
  response.cookies.set({
    name: getBypassCookieName(),
    value: cookieValue,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 14,
  });

  return response;
}

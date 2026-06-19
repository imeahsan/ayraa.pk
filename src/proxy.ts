import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const appMode = process.env.NEXT_PUBLIC_APP_MODE || "live";

  const isAdminRoute = pathname.startsWith("/admin");
  const isApiRoute = pathname.startsWith("/api");
  const isAuthCallback = pathname.startsWith("/auth/callback");
  const isAuthRoute = pathname === "/login" || pathname === "/register";
  const isSpecialPage = pathname === "/coming-soon" || pathname === "/maintenance";

  // Check if we need to apply coming-soon / maintenance redirect
  if (!isAdminRoute && !isApiRoute && !isAuthCallback && !isAuthRoute) {
    if (appMode === "coming-soon") {
      if (pathname !== "/coming-soon") {
        return NextResponse.rewrite(new URL("/coming-soon", request.url));
      }
    } else if (appMode === "maintenance") {
      if (pathname !== "/maintenance") {
        return NextResponse.rewrite(new URL("/maintenance", request.url));
      }
    } else {
      // If we are in live mode, prevent direct access to /coming-soon or /maintenance
      if (isSpecialPage) {
        return NextResponse.redirect(new URL("/", request.url));
      }
    }
  }

  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Check admin route protection
  if (isAdminRoute) {
    if (!user) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirectTo", request.nextUrl.pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Check user role from profiles table
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || profile.role !== "admin") {
      // Not authorized, redirect to homepage
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  // Redirect authenticated users away from login/register
  if (user && isAuthRoute) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  
  // Try to get redirect destination from cookie, then query param, default to "/"
  const cookieStore = await cookies();
  const cookieRedirect = cookieStore.get("sb-oauth-redirect-to")?.value;
  const redirectTo = cookieRedirect || searchParams.get("redirectTo") || "/";

  if (code) {
    try {
      const supabase = await createClient();
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error) {
        // Clear the cookie since we've used it
        if (cookieRedirect) {
          try {
            cookieStore.delete("sb-oauth-redirect-to");
          } catch (e) {
            console.error("Failed to delete oauth redirect cookie:", e);
          }
        }

        const forwardedHost = request.headers.get("x-forwarded-host");
        const isLocalEnv = process.env.NODE_ENV === "development";
        
        let targetUrl: string;
        if (redirectTo.startsWith("/")) {
          if (isLocalEnv) {
            targetUrl = `${origin}${redirectTo}`;
          } else if (forwardedHost) {
            targetUrl = `https://${forwardedHost}${redirectTo}`;
          } else {
            targetUrl = `${origin}${redirectTo}`;
          }
        } else {
          try {
            const parsedTarget = new URL(redirectTo);
            const allowedHosts = ["localhost:3000", "store.ayraa.pk", "beta.ayraa.pk"];
            if (allowedHosts.includes(parsedTarget.host)) {
              targetUrl = redirectTo;
            } else {
              targetUrl = `${origin}/`;
            }
          } catch {
            targetUrl = `${origin}/`;
          }
        }
        
        return NextResponse.redirect(targetUrl);
      }
    } catch (err) {
      console.error("Auth callback exception:", err);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=Authentication failed`);
}

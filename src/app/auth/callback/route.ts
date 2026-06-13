import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const redirectTo = searchParams.get("redirectTo") || "/";

  if (code) {
    try {
      const supabase = await createClient();
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error) {
        const forwardedHost = request.headers.get("x-forwarded-host");
        const isLocalEnv = process.env.NODE_ENV === "development";
        if (isLocalEnv) {
          return NextResponse.redirect(`${origin}${redirectTo}`);
        } else if (forwardedHost) {
          return NextResponse.redirect(`https://${forwardedHost}${redirectTo}`);
        } else {
          return NextResponse.redirect(`${origin}${redirectTo}`);
        }
      }
    } catch (err) {
      console.error("Auth callback exception:", err);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=Authentication failed`);
}

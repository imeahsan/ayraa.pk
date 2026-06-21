import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * A cookie-free Supabase client for use inside `unstable_cache()`.
 *
 * `unstable_cache` runs in a context that does NOT have access to
 * Next.js dynamic data sources (cookies, headers, searchParams).
 * Calling `cookies()` inside a cached function throws an error.
 *
 * Use this client whenever you need to query public/read-only data
 * inside `unstable_cache`. For anything requiring auth (user-specific
 * data, row-level security with the user's session), use `createClient`
 * from `@/lib/supabase/server` instead, outside the cache boundary.
 */
export function createCacheClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

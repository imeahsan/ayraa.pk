# Supabase Security Audit

Audit date: 2026-07-04  
Project: Ayra frontend / Supabase backend  
Scope: live Supabase Postgres metadata and RLS policies via `SUPABASE_DB_URL`, local migrations in `supabase/migrations`, and Supabase usage in `src`.

No secret values, customer records, order contents, or email addresses were copied into this report. Live validation used metadata, counts, and rolled-back transactions only.

## Executive Summary

The current Supabase security posture is not production-safe. RLS is enabled on all public application tables, but several policies allow unauthorized disclosure or privilege escalation. The most urgent issue is that any authenticated customer can update their own `profiles.role` to `admin`, which causes every admin policy and the `/admin` route guard to trust them as an administrator.

Critical live-confirmed issues:

1. Any authenticated non-admin user can self-promote to `admin`.
2. Public users can read `store_settings`, which contains populated SMTP credential columns.
3. Anonymous users can read guest orders and guest order items.
4. Anonymous users can create arbitrary orders and order items with forged totals, discounts, and quantities.

Immediate action should be to take the site/admin offline or restrict Supabase API access until the critical policy fixes are applied, rotate exposed SMTP credentials, and review admin account activity.

## Audit Method

- Read `.env.local` only to identify credential availability. Secret values were not printed.
- Connected to the live database using `SUPABASE_DB_URL`.
- Queried `pg_policies`, `information_schema.role_table_grants`, table RLS status, storage bucket settings, function security metadata, and row estimates/counts.
- Simulated `anon` and `authenticated` roles with rolled-back transactions to verify exploitability without persisting changes.
- Reviewed relevant migrations and application call sites.

## Live Environment Facts

- All public application tables have RLS enabled.
- All inspected `storage` tables have RLS enabled.
- No public views were found.
- No tables were found in the Supabase realtime publication.
- Public buckets:
  - `products`
  - `product-ar-assets`
  - `review-images`
- Private buckets:
  - `ar-captures`
- Storage buckets have no configured `file_size_limit`.
- Storage buckets have no configured `allowed_mime_types`.
- `public.handle_new_user()` is `SECURITY DEFINER` and does not pin `search_path`.

Live count evidence:

| Area | Live result |
| --- | ---: |
| Profiles | 10 |
| Profiles with email | 10 |
| Admin profiles | 7 |
| Guest orders visible by current policy | 2 |
| Guest order items visible by current policy | 5 |
| Store settings rows with SMTP config | 1 |
| Store settings rows with SMTP password populated | 1 |
| Product questions | 3 |
| Products | 47 |
| Product variants | 165 |
| Email marketing campaigns | 9 |

## Critical Findings

### C-01: Authenticated users can self-promote to admin

Severity: Critical  
Status: Live exploitable, verified with rolled-back transaction  
Affected object: `public.profiles`  
Evidence:

- Policy source: `supabase/migrations/20260613000000_init_schema.sql:26`
- Policy: `Users edit own profile`
- Live policy condition: `FOR UPDATE USING (auth.uid() = id)`
- Rolled-back test result: a non-admin profile could update its own `role` to `admin`.

Impact:

Any logged-in customer can become an admin by directly calling the Supabase API against `profiles`. Once their profile role is `admin`, every admin policy that checks `public.profiles.role = 'admin'` grants access. The `/admin` route protection also trusts the same profile role, so the attacker can enter the admin UI.

Root cause:

The policy allows updating the whole profile row. It does not restrict sensitive columns such as `role`, `email`, or `created_at`.

Recommended immediate fix:

```sql
begin;

drop policy if exists "Users edit own profile" on public.profiles;

revoke update on public.profiles from anon, authenticated;
grant update (full_name, phone, avatar_url) on public.profiles to authenticated;

create policy "Users update own safe profile fields"
on public.profiles
for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

commit;
```

Recommended structural fix:

- Do not let browser clients update `profiles.role`.
- Move role management to a service-role-only server endpoint or a tightly controlled `SECURITY DEFINER` function.
- Create a safe admin helper function and use it consistently in policies:

```sql
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public, pg_catalog
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'admin'
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;
```

After applying fixes, re-test with a non-admin authenticated user and confirm `update public.profiles set role = 'admin'` is denied.

### C-02: Public can read populated SMTP secrets in `store_settings`

Severity: Critical  
Status: Live exploitable  
Affected object: `public.store_settings`  
Evidence:

- Public read policy source: `supabase/migrations/20260613000000_init_schema.sql:229`
- SMTP secret columns added at: `supabase/migrations/20260702000000_email_marketing.sql:7`
- Live check: 1 `store_settings` row has SMTP config populated.
- Live check: 1 `store_settings` row has `smtp_pass` populated.
- Public application type includes `smtp_pass`: `src/types/index.ts:308`

Impact:

Anonymous users can query `store_settings` through the public anon key and retrieve SMTP host, username, password, and sender configuration if selected. This can lead to email account compromise, spam abuse, phishing, account reputation damage, and unauthorized transactional or marketing emails.

Root cause:

The original `store_settings` table was public-readable for storefront display settings. Later migrations added SMTP credential columns to the same public-readable table.

Required immediate actions:

1. Rotate the SMTP password/API key now.
2. Remove SMTP secrets from public-readable tables.
3. Drop public read access on `store_settings` or replace it with a public-safe view.

Recommended fix:

```sql
begin;

drop policy if exists "Anyone read settings" on public.store_settings;

create or replace view public.public_store_settings as
select
  id,
  brand_name,
  brand_description,
  contact_email,
  contact_phone,
  shipping_flat_rate,
  free_shipping_threshold,
  meta_title_template,
  meta_description,
  logo_url,
  favicon_url
from public.store_settings;

grant select on public.public_store_settings to anon, authenticated;

create policy "Admin read settings"
on public.store_settings
for select
to authenticated
using (public.is_admin());

create policy "Admin write settings"
on public.store_settings
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

commit;
```

Application follow-up:

- Public storefront reads should use `public_store_settings`, not `store_settings`.
- Email sending should read SMTP credentials only from environment variables, a secrets manager, or a server-only service-role path.
- Clear `localStorage` key `ayra_store_settings` in admin browsers if SMTP values may have been cached there.

### C-03: Anonymous users can read guest orders and guest order items

Severity: Critical  
Status: Live exploitable  
Affected objects: `public.orders`, `public.order_items`  
Evidence:

- Orders policy source: `supabase/migrations/20260613000000_init_schema.sql:163`
- Order items policy source: `supabase/migrations/20260613000000_init_schema.sql:191`
- Live policy for orders: `auth.uid() = user_id OR user_id IS NULL`
- Live policy for order items inherits visibility for orders where `user_id IS NULL`.
- Live count: 2 guest orders are visible to anonymous users.
- Live count: 5 guest order items are visible to anonymous users.

Impact:

Guest orders include PII fields such as shipping address, contact phone, contact email, city, totals, and order status. Because every guest order has `user_id IS NULL`, every anonymous visitor can read every guest order and related order item allowed by the policy.

Recommended immediate fix:

```sql
begin;

drop policy if exists "Users view own orders" on public.orders;
create policy "Users view own orders"
on public.orders
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users view own order items" on public.order_items;
create policy "Users view own order items"
on public.order_items
for select
to authenticated
using (
  exists (
    select 1
    from public.orders
    where orders.id = order_items.order_id
      and orders.user_id = auth.uid()
  )
);

commit;
```

Recommended guest-order design:

- Do not use `user_id IS NULL` as an authorization rule.
- Add a random, high-entropy `guest_access_token_hash` or `order_lookup_token_hash`.
- Expose guest lookup only through a server route that verifies token plus email/phone.
- Consider migrating guest checkout to create an anonymous auth user or require login for order history.

### C-04: Anonymous users can create arbitrary orders and order items

Severity: Critical  
Status: Live exploitable, verified with rolled-back transaction  
Affected objects: `public.orders`, `public.order_items`  
Evidence:

- Order insert policy: `supabase/migrations/20260613000000_init_schema.sql:166`
- Order item insert policy: `supabase/migrations/20260613000000_init_schema.sql:199`
- Live policy: `WITH CHECK (true)` on both inserts.
- Rolled-back test result: anonymous role could insert an order.
- Rolled-back test result: anonymous role could insert arbitrary `discount_amount`.
- Rolled-back test result: anonymous role could insert arbitrary order item quantity and unit price.

Impact:

Attackers can create fake orders, manipulate totals/discounts, submit impossible quantities, poison reporting, trigger operational workflows, and potentially cause email spam or admin workload. Since the browser uses the public anon key, these inserts can be performed outside the intended checkout UI.

Root cause:

The database trusts client-supplied order totals, discounts, unit prices, and line items.

Recommended fix:

- Drop direct public insert policies for `orders` and `order_items`.
- Move checkout creation into a server route using service role, or into a `SECURITY DEFINER` RPC that validates cart items against current product/variant prices.
- Compute subtotal, discount, shipping, total, and stock deduction server-side.
- Enforce reasonable quantity limits and active/available variant checks.
- Make order creation atomic in one transaction.

Policy direction:

```sql
drop policy if exists "Anyone insert order" on public.orders;
drop policy if exists "Anyone insert order items" on public.order_items;

revoke insert on public.orders from anon, authenticated;
revoke insert on public.order_items from anon, authenticated;
```

Application follow-up:

- `src/app/actions/orders.ts` currently inserts orders and items using the request user's anon/authenticated Supabase client.
- That action also tries to update `product_variants.stock_quantity`, but non-admin users should not be able to update inventory directly.
- Replace this flow with a server-only checkout service that uses validated inputs and a privileged database path.

## High Findings

### H-01: Public profile reads expose user directory and admin identities

Severity: High  
Affected object: `public.profiles`  
Evidence:

- Policy source: `supabase/migrations/20260613000000_init_schema.sql:23`
- Live policy: `FOR SELECT USING (true)`
- Live count: 10 profiles visible.
- Live count: 10 profile emails visible.
- Live count: 7 admin profiles visible.

Impact:

Anonymous users can enumerate customer/admin IDs, emails, names, avatars, and roles. This supports phishing, credential stuffing, admin targeting, and account takeover attempts.

Recommended fix:

- Replace public profile reads with `Users read own profile` and `Admins read profiles`.
- Avoid direct self-referential admin checks on `profiles`; use the `public.is_admin()` helper described in C-01.

Example:

```sql
drop policy if exists "Public read profiles" on public.profiles;

create policy "Users read own profile"
on public.profiles
for select
to authenticated
using (auth.uid() = id);

create policy "Admins read profiles"
on public.profiles
for select
to authenticated
using (public.is_admin());
```

### H-02: AR capture upload policies allow anonymous unbounded writes

Severity: High  
Affected objects: `public.bedsheet_ar_captures`, `storage.objects` bucket `ar-captures`  
Evidence:

- DB insert policy: `supabase/migrations/20260620000001_bedsheet_ar.sql:70`
- Storage upload policy: `supabase/migrations/20260620000001_bedsheet_ar.sql:114`
- Bucket `ar-captures` is private, but uploads are allowed for anyone.
- Bucket has no file size or MIME type limits.

Impact:

Anonymous users can upload arbitrary objects into `ar-captures` and create capture rows. This can cause storage cost abuse, malware hosting attempts, database spam, and operational noise. The storage read/delete policies assume a path layout, but the insert policy does not enforce that the path belongs to the authenticated user or a controlled guest session.

Recommended fix:

- Require authentication for capture uploads, or issue short-lived guest upload tokens from a server route.
- Configure bucket MIME and size limits.
- Enforce storage path ownership in `WITH CHECK`.
- Rate-limit the API route.
- Validate uploaded file type server-side before upload.

Example storage direction:

```sql
drop policy if exists "Anyone upload ar captures to storage" on storage.objects;

create policy "Users upload own ar captures"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'ar-captures'
  and (storage.foldername(name))[1] = 'users'
  and (storage.foldername(name))[2] = auth.uid()::text
);
```

### H-03: Product review trust is enforced in application code, not database policy

Severity: High  
Affected object: `public.product_reviews`  
Evidence:

- Insert policy source: `supabase/migrations/20260621000002_product_reviews.sql:26`
- Policy only checks `auth.uid() = user_id`.
- Server action validates purchase before insert, but a direct Supabase client can bypass that action.
- Review rows include trust fields such as `is_verified_buyer` and `is_approved`.

Impact:

Any authenticated user can directly insert an approved, verified-looking review for any product if they set their own `user_id`. This bypasses the purchase check in `src/app/actions/reviews.ts`.

Recommended fix:

- Do not grant direct insert to `product_reviews`.
- Use a server-only route/RPC that verifies a non-cancelled order item for the user.
- Force `is_verified_buyer` and `is_approved` server-side or with database defaults/triggers.
- Consider moderation default: `is_approved = false`.

### H-04: Product Q&A allows public insert and public read of all questions

Severity: High/Medium depending on intended storefront behavior  
Affected object: `public.product_questions`  
Evidence:

- Live policy: public `INSERT WITH CHECK (true)`.
- Live policy: public `SELECT USING (true)`.
- Live count: 3 questions, 2 unanswered.
- Server action `src/app/actions/qa.ts` does not require authentication for question submission.

Impact:

Attackers can spam product questions and publish unmoderated question text immediately. If customers submit personal details in questions, those details are public.

Recommended fix:

- Add `is_approved` or `status` to questions.
- Allow public reads only for approved/answered questions.
- Require captcha/rate limiting for guest questions.
- Prefer server route insertion with validation and abuse controls.

### H-05: Storage review image uploads lack database-level purchase validation and bucket limits

Severity: High/Medium  
Affected bucket: `review-images`  
Evidence:

- Bucket is public.
- Upload policy allows any authenticated user to upload.
- Bucket has no file size limit.
- Bucket has no MIME type limit.

Impact:

Authenticated users can upload public files even if they never purchased a product. This can cause storage abuse and public hosting of unwanted content. If public URLs are used in reviews, abuse can persist even after review moderation unless orphaned objects are cleaned.

Recommended fix:

- Set MIME and size limits for the bucket.
- Upload review images only through a server route after purchase validation.
- Store paths under `users/{auth.uid()}/...` and enforce path ownership.
- Clean orphaned review images not attached to approved reviews.

## Medium Findings

### M-01: Active promo codes are publicly enumerable

Severity: Medium  
Affected object: `public.promo_codes`  
Evidence:

- Policy source: `supabase/migrations/20260620000003_promo_codes.sql:24`
- Live count: 1 active promo code visible to anonymous users.

Impact:

Anyone can scrape all active promo codes and discount values instead of only validating a submitted code.

Recommended fix:

- Replace direct public `SELECT` with an RPC such as `validate_promo_code(code text, cart_context jsonb)`.
- Return only the validation result and computed discount.

### M-02: Broad table grants increase blast radius of permissive policies

Severity: Medium  
Evidence:

The live database grants `DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE` on many public tables to `anon` and `authenticated`. RLS blocks most access, but broad grants mean a single permissive or missing RLS policy immediately exposes dangerous operations.

Recommended fix:

- Revoke table privileges not required by the client role.
- Grant only operation-specific permissions per table.
- Keep public-facing tables read-only unless writes are explicitly required.

Example:

```sql
revoke all on all tables in schema public from anon, authenticated;

grant select on public.products, public.product_images, public.product_variants, public.categories,
  public.hero_slides, public.ticker_announcements to anon, authenticated;
```

Apply this carefully after mapping application requirements.

### M-03: `handle_new_user` security-definer function does not pin `search_path`

Severity: Medium/Low  
Affected function: `public.handle_new_user()`  
Evidence:

- Defined at `supabase/migrations/20260613000000_init_schema.sql:246`
- Live function is `SECURITY DEFINER`.
- Live function config has no pinned `search_path`.
- `EXECUTE` is granted to `anon`, `authenticated`, and `service_role`.

Impact:

Unpinned `search_path` is a common security-definer hardening issue. This function uses mostly schema-qualified references, so exploitability appears limited, but it should still be hardened.

Recommended fix:

```sql
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    'customer'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

revoke all on function public.handle_new_user() from public;
```

### M-04: Admin checks depend entirely on mutable profile rows

Severity: Medium, but becomes Critical because of C-01  
Affected app files:

- `src/proxy.ts`
- `src/app/admin/layout.tsx`

Impact:

The route guard queries `profiles.role` using the same public Supabase client/RLS model. If a user can mutate their profile role, the app and database both grant admin access.

Recommended fix:

- Fix C-01 first.
- Consider using immutable custom auth claims for admin status, or a service-role server check.
- Keep RLS as the authoritative data boundary even if the UI route guard fails.

## Positive Controls Observed

- RLS is enabled on all public application tables.
- Storage buckets are covered by RLS policies.
- No service-role key was found in `.env.local`.
- No live database views were found.
- No live realtime table publication was found.
- Admin-only policies exist for many operational tables, including returns, shipments, email marketing campaigns, and admin catalog writes.

## Immediate Remediation Plan

1. Disable or restrict admin access until C-01 is fixed.
2. Apply the profile update lockdown and verify non-admin users cannot change `role`.
3. Rotate SMTP credentials and remove SMTP secrets from public-readable `store_settings`.
4. Remove `user_id IS NULL` from order/order-item read policies.
5. Remove public direct inserts into `orders` and `order_items`; move checkout creation server-side.
6. Lock down public profile reads.
7. Add upload limits and path ownership checks for storage buckets.
8. Replace direct review/question writes with validated server routes or RPCs.
9. Revoke broad grants and re-grant only required operations after testing.
10. Re-run this audit and add automated policy regression tests.

## Suggested Regression Tests

Run these against a staging clone after applying fixes:

- Anonymous role cannot select `smtp_pass` from `store_settings`.
- Anonymous role cannot select any rows from `orders`.
- Anonymous role cannot select any rows from `order_items`.
- Anonymous role cannot insert into `orders`.
- Anonymous role cannot insert into `order_items`.
- Authenticated customer cannot update `profiles.role`.
- Authenticated customer cannot select other users' profiles.
- Authenticated customer cannot insert approved/verified reviews without verified purchase.
- Anonymous role cannot upload to `ar-captures`.
- Public storefront still reads products, categories, product images, active hero slides, active ticker announcements, and public-safe settings.

## Final Risk Rating

Current risk: Critical.

The database currently exposes sensitive operational data and allows privilege escalation from customer to admin. Fix C-01 and C-02 before treating any other admin or customer-data controls as trustworthy.

-- ================================================
-- Fix Supabase Advisor Security Issues
-- 1. Enable RLS on public.app_schema_migrations
-- 2. Set security_invoker = true on public.public_store_settings
-- ================================================

-- 1. Fix: Enable RLS on app_schema_migrations
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_tables
    WHERE schemaname = 'public' AND tablename = 'app_schema_migrations'
  ) THEN
    EXECUTE 'ALTER TABLE public.app_schema_migrations ENABLE ROW LEVEL SECURITY;';

    EXECUTE 'DROP POLICY IF EXISTS "Admin only app_schema_migrations" ON public.app_schema_migrations;';
    EXECUTE 'CREATE POLICY "Admin only app_schema_migrations" ON public.app_schema_migrations
      FOR ALL
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM public.profiles
          WHERE profiles.id = auth.uid() AND profiles.role = ''admin''
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.profiles
          WHERE profiles.id = auth.uid() AND profiles.role = ''admin''
        )
      );';

    EXECUTE 'REVOKE ALL ON public.app_schema_migrations FROM anon;';
  END IF;
END $$;

-- 2. Fix: Set security_invoker = true on public.public_store_settings view
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_views
    WHERE schemaname = 'public' AND viewname = 'public_store_settings'
  ) THEN
    EXECUTE '
      CREATE OR REPLACE VIEW public.public_store_settings
      WITH (security_invoker = true)
      AS
      SELECT
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
      FROM public.store_settings;
    ';
  END IF;
END $$;

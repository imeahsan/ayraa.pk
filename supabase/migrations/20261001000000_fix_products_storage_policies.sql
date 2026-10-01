-- ===============================================================
-- FIX STORAGE POLICIES FOR PRODUCTS BUCKET
-- Resolves "Storage upload failed: new row violates row-level security policy"
-- 1. Ensure products bucket is public
-- 2. Restore missing "Public read products images" SELECT policy
-- 3. Enhance admin upload/update/delete policies with public.is_admin()
-- ===============================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('products', 'products', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Drop obsolete or missing policies on storage.objects for products bucket
DROP POLICY IF EXISTS "Public read products images" ON storage.objects;
DROP POLICY IF EXISTS "Admin upload product images" ON storage.objects;
DROP POLICY IF EXISTS "Admin update product images" ON storage.objects;
DROP POLICY IF EXISTS "Admin delete product images" ON storage.objects;

-- 1. Public read for products bucket (storefront access & INSERT ... RETURNING check)
CREATE POLICY "Public read products images" ON storage.objects
    FOR SELECT
    USING (bucket_id = 'products');

-- 2. Allow admins to insert/upload images to products bucket
CREATE POLICY "Admin upload product images" ON storage.objects
    FOR INSERT
    TO authenticated
    WITH CHECK (
        bucket_id = 'products' AND (
            public.is_admin() OR
            EXISTS (
                SELECT 1 FROM public.profiles
                WHERE public.profiles.id = auth.uid() AND public.profiles.role = 'admin'
            )
        )
    );

-- 3. Allow admins to update images in products bucket
CREATE POLICY "Admin update product images" ON storage.objects
    FOR UPDATE
    TO authenticated
    USING (
        bucket_id = 'products' AND (
            public.is_admin() OR
            EXISTS (
                SELECT 1 FROM public.profiles
                WHERE public.profiles.id = auth.uid() AND public.profiles.role = 'admin'
            )
        )
    )
    WITH CHECK (
        bucket_id = 'products' AND (
            public.is_admin() OR
            EXISTS (
                SELECT 1 FROM public.profiles
                WHERE public.profiles.id = auth.uid() AND public.profiles.role = 'admin'
            )
        )
    );

-- 4. Allow admins to delete images from products bucket
CREATE POLICY "Admin delete product images" ON storage.objects
    FOR DELETE
    TO authenticated
    USING (
        bucket_id = 'products' AND (
            public.is_admin() OR
            EXISTS (
                SELECT 1 FROM public.profiles
                WHERE public.profiles.id = auth.uid() AND public.profiles.role = 'admin'
            )
        )
    );

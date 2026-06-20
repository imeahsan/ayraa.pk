-- ================================================
-- PRODUCT IMAGES STORAGE BUCKET CONFIGURATION
-- ================================================

-- Create the public bucket for product images if it does not exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('products', 'products', true)
ON CONFLICT (id) DO NOTHING;

-- RLS Policies on storage.objects for the 'products' bucket

-- 1. Enable public read access for storefront
CREATE POLICY "Public read products images" ON storage.objects
    FOR SELECT USING (bucket_id = 'products');

-- 2. Allow admins to insert/upload product images
CREATE POLICY "Admin upload product images" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'products' AND
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE public.profiles.id = auth.uid() AND public.profiles.role = 'admin'
        )
    );

-- 3. Allow admins to update product images
CREATE POLICY "Admin update product images" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'products' AND
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE public.profiles.id = auth.uid() AND public.profiles.role = 'admin'
        )
    );

-- 4. Allow admins to delete product images
CREATE POLICY "Admin delete product images" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'products' AND
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE public.profiles.id = auth.uid() AND public.profiles.role = 'admin'
        )
    );

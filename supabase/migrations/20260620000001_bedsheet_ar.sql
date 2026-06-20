-- ================================================
-- BEDSHEET LIVE AR PREVIEW (MODE 1) MIGRATION
-- ================================================

-- 1. Modify products table to support AR state
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS bedsheet_ar_status TEXT NOT NULL DEFAULT 'not_ready'
CHECK (bedsheet_ar_status IN ('not_ready', 'ready', 'disabled'));

-- 2. Create bedsheet_ar_assets table for textures and scale/opacity settings
CREATE TABLE IF NOT EXISTS public.bedsheet_ar_assets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE UNIQUE,
    texture_url TEXT NOT NULL,
    texture_storage_path TEXT,
    texture_width INT,
    texture_height INT,
    default_opacity DECIMAL(5, 2) NOT NULL DEFAULT 0.85 CHECK (default_opacity >= 0 AND default_opacity <= 1),
    default_scale DECIMAL(5, 2) NOT NULL DEFAULT 1.0 CHECK (default_scale > 0),
    default_rotation DECIMAL(5, 2) NOT NULL DEFAULT 0,
    repeat_mode TEXT NOT NULL DEFAULT 'repeat' CHECK (repeat_mode IN ('repeat', 'cover', 'contain')),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on bedsheet_ar_assets
ALTER TABLE public.bedsheet_ar_assets ENABLE ROW LEVEL SECURITY;

-- Policies for bedsheet_ar_assets
CREATE POLICY "Anyone read active ar assets" ON public.bedsheet_ar_assets
    FOR SELECT USING (is_active = true);

CREATE POLICY "Admin write ar assets" ON public.bedsheet_ar_assets
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE public.profiles.id = auth.uid() AND public.profiles.role = 'admin'
        )
    );

-- 3. Create bedsheet_ar_captures table for saving user previews
CREATE TABLE IF NOT EXISTS public.bedsheet_ar_captures (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    session_id TEXT,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    input_type TEXT NOT NULL DEFAULT 'live_camera',
    result_image_url TEXT NOT NULL,
    result_storage_path TEXT NOT NULL,
    corner_points JSONB NOT NULL DEFAULT '[]'::jsonb,
    settings JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on bedsheet_ar_captures
ALTER TABLE public.bedsheet_ar_captures ENABLE ROW LEVEL SECURITY;

-- Policies for bedsheet_ar_captures
CREATE POLICY "Users view own captures" ON public.bedsheet_ar_captures
    FOR SELECT USING (
        auth.uid() = user_id OR 
        (auth.uid() IS NULL AND session_id IS NOT NULL) OR
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE public.profiles.id = auth.uid() AND public.profiles.role = 'admin'
        )
    );

CREATE POLICY "Anyone insert captures" ON public.bedsheet_ar_captures
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users delete own captures" ON public.bedsheet_ar_captures
    FOR DELETE USING (
        auth.uid() = user_id OR
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE public.profiles.id = auth.uid() AND public.profiles.role = 'admin'
        )
    );

-- 4. Set up Supabase Storage Buckets
INSERT INTO storage.buckets (id, name, public)
VALUES 
    ('product-ar-assets', 'product-ar-assets', true),
    ('ar-captures', 'ar-captures', false)
ON CONFLICT (id) DO NOTHING;

-- 5. Policies for product-ar-assets bucket
CREATE POLICY "Public read product-ar-assets" ON storage.objects
    FOR SELECT USING (bucket_id = 'product-ar-assets');

CREATE POLICY "Admin manage product-ar-assets" ON storage.objects
    USING (
        bucket_id = 'product-ar-assets' AND
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE public.profiles.id = auth.uid() AND public.profiles.role = 'admin'
        )
    );

-- 6. Policies for ar-captures bucket
CREATE POLICY "Users read own captures from storage" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'ar-captures' AND (
            auth.uid()::text = (storage.foldername(name))[2] OR
            EXISTS (
                SELECT 1 FROM public.profiles
                WHERE public.profiles.id = auth.uid() AND public.profiles.role = 'admin'
            )
        )
    );

CREATE POLICY "Anyone upload ar captures to storage" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'ar-captures');

CREATE POLICY "Users delete own captures from storage" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'ar-captures' AND (
            auth.uid()::text = (storage.foldername(name))[2] OR
            EXISTS (
                SELECT 1 FROM public.profiles
                WHERE public.profiles.id = auth.uid() AND public.profiles.role = 'admin'
            )
        )
    );

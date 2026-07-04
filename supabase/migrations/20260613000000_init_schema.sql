-- ================================================
-- AYRA E-COMMERCE DATABASE INITIALIZATION
-- ================================================

-- ---------- 1. Enable UUID Extension ----------
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ---------- 2. Profiles Table ----------
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    full_name TEXT,
    phone TEXT,
    avatar_url TEXT,
    role TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'admin')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on Profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
CREATE POLICY "Public read profiles" ON public.profiles
    FOR SELECT USING (true);

CREATE POLICY "Users edit own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- ---------- 3. Categories Table ----------
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    image_url TEXT,
    parent_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    sort_order INT DEFAULT 0 NOT NULL,
    is_active BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on Categories
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Categories Policies
CREATE POLICY "Anyone read active categories" ON public.categories
    FOR SELECT USING (is_active = true);

CREATE POLICY "Admin write categories" ON public.categories
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE public.profiles.id = auth.uid() AND public.profiles.role = 'admin'
        )
    );

-- ---------- 4. Products Table ----------
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    price DECIMAL(12, 2) NOT NULL CHECK (price >= 0),
    compare_at_price DECIMAL(12, 2) CHECK (compare_at_price IS NULL OR compare_at_price >= 0),
    sku TEXT UNIQUE,
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    is_active BOOLEAN DEFAULT true NOT NULL,
    is_featured BOOLEAN DEFAULT false NOT NULL,
    fabric TEXT,
    color TEXT,
    includes TEXT,
    care_instructions TEXT,
    meta_title TEXT,
    meta_description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on Products
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Products Policies
CREATE POLICY "Anyone read active products" ON public.products
    FOR SELECT USING (is_active = true);

CREATE POLICY "Admin write products" ON public.products
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE public.profiles.id = auth.uid() AND public.profiles.role = 'admin'
        )
    );

-- ---------- 5. Product Images Table ----------
CREATE TABLE IF NOT EXISTS public.product_images (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
    url TEXT NOT NULL,
    alt_text TEXT,
    sort_order INT DEFAULT 0 NOT NULL,
    is_primary BOOLEAN DEFAULT false NOT NULL
);

-- Enable RLS on Product Images
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;

-- Product Images Policies
CREATE POLICY "Anyone read product images" ON public.product_images
    FOR SELECT USING (true);

CREATE POLICY "Admin write product images" ON public.product_images
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE public.profiles.id = auth.uid() AND public.profiles.role = 'admin'
        )
    );

-- ---------- 6. Product Variants Table ----------
CREATE TABLE IF NOT EXISTS public.product_variants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
    size TEXT NOT NULL,
    stock_quantity INT DEFAULT 0 NOT NULL CHECK (stock_quantity >= 0),
    is_available BOOLEAN DEFAULT true NOT NULL,
    UNIQUE(product_id, size)
);

-- Enable RLS on Product Variants
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;

-- Product Variants Policies
CREATE POLICY "Anyone read product variants" ON public.product_variants
    FOR SELECT USING (true);

CREATE POLICY "Admin write product variants" ON public.product_variants
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE public.profiles.id = auth.uid() AND public.profiles.role = 'admin'
        )
    );

-- ---------- 7. Orders Table ----------
CREATE TABLE IF NOT EXISTS public.orders (
    id TEXT PRIMARY KEY DEFAULT 'AYR-' || floor(random() * (999999 - 100000 + 1) + 100000)::text,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    status TEXT DEFAULT 'pending' NOT NULL CHECK (status IN ('pending', 'processing', 'shipped', 'delivered', 'cancelled')),
    payment_method TEXT DEFAULT 'cod' NOT NULL CHECK (payment_method = 'cod'),
    subtotal DECIMAL(12, 2) NOT NULL CHECK (subtotal >= 0),
    shipping_cost DECIMAL(12, 2) NOT NULL CHECK (shipping_cost >= 0),
    total DECIMAL(12, 2) NOT NULL CHECK (total >= 0),
    shipping_address JSONB NOT NULL,
    contact_phone TEXT NOT NULL,
    contact_email TEXT NOT NULL,
    city TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on Orders
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Orders Policies
CREATE POLICY "Users view own orders" ON public.orders
    FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Anyone insert order" ON public.orders
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Admin manage orders" ON public.orders
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE public.profiles.id = auth.uid() AND public.profiles.role = 'admin'
        )
    );

-- ---------- 8. Order Items Table ----------
CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id TEXT REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    variant_id UUID REFERENCES public.product_variants(id) ON DELETE SET NULL,
    quantity INT NOT NULL CHECK (quantity > 0),
    unit_price DECIMAL(12, 2) NOT NULL CHECK (unit_price >= 0)
);

-- Enable RLS on Order Items
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Order Items Policies
CREATE POLICY "Users view own order items" ON public.order_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.orders
            WHERE public.orders.id = order_id AND (public.orders.user_id = auth.uid() OR public.orders.user_id IS NULL)
        )
    );

CREATE POLICY "Anyone insert order items" ON public.order_items
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Admin manage order items" ON public.order_items
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE public.profiles.id = auth.uid() AND public.profiles.role = 'admin'
        )
    );

-- ---------- 9. Store Settings Table ----------
CREATE TABLE public.store_settings (
    id INT PRIMARY KEY CHECK (id = 1),
    brand_name TEXT NOT NULL,
    brand_description TEXT,
    contact_email TEXT NOT NULL,
    contact_phone TEXT NOT NULL,
    shipping_flat_rate DECIMAL(12, 2) NOT NULL,
    free_shipping_threshold DECIMAL(12, 2) NOT NULL,
    meta_title_template TEXT NOT NULL,
    meta_description TEXT NOT NULL,
    logo_url TEXT,
    favicon_url TEXT
);

-- Enable RLS on Settings
ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;

-- Settings Policies
CREATE POLICY "Anyone read settings" ON public.store_settings
    FOR SELECT USING (true);

CREATE POLICY "Admin write settings" ON public.store_settings
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE public.profiles.id = auth.uid() AND public.profiles.role = 'admin'
        )
    );

-- ---------- 10. Triggers: Auto Profile on Auth Sign Up ----------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, role)
    VALUES (
        new.id,
        new.email,
        coalesce(new.raw_user_meta_data->>'full_name', ''),
        'customer'
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ---------- 11. Seed Store Settings ----------
INSERT INTO public.store_settings (
    id, brand_name, brand_description, contact_email, contact_phone,
    shipping_flat_rate, free_shipping_threshold, meta_title_template,
    meta_description
) VALUES (
    1, 'Ayra Collection', 'Premium Eastern Haute Couture.',
    'care@ayraa.pk', '+92 329 5822495',
    250, 5000, 'Ayra | %s', 'Luxury prêt-à-porter collection for women.'
) ON CONFLICT (id) DO NOTHING;

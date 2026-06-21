-- Create ticker_announcements table
CREATE TABLE IF NOT EXISTS public.ticker_announcements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message TEXT NOT NULL,
    sort_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.ticker_announcements ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow public read for ticker_announcements" ON public.ticker_announcements
    FOR SELECT USING (is_active = TRUE);

CREATE POLICY "Allow admin all for ticker_announcements" ON public.ticker_announcements
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE public.profiles.id = auth.uid() AND public.profiles.role = 'admin'
        )
    );

-- Create hero_slides table
CREATE TABLE IF NOT EXISTS public.hero_slides (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    image_url TEXT NOT NULL,
    badge TEXT,
    title TEXT NOT NULL,
    subtitle TEXT,
    button_text TEXT,
    button_link TEXT,
    sort_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.hero_slides ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow public read for hero_slides" ON public.hero_slides
    FOR SELECT USING (is_active = TRUE);

CREATE POLICY "Allow admin all for hero_slides" ON public.hero_slides
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE public.profiles.id = auth.uid() AND public.profiles.role = 'admin'
        )
    );

-- Seed Initial Ticker Messages
INSERT INTO public.ticker_announcements (message, sort_order) VALUES
('Free shipping on orders above PKR 5,000', 1),
('Handcrafted Heritage Pieces', 2),
('New Summer Lawn Arrivals', 3),
('Premium Fabrics — Lawn, Chiffon & Silk', 4),
('Nationwide Delivery Across Pakistan', 5),
('Authentic Eastern Craftsmanship', 6);

-- Seed 5 Hero Slides
INSERT INTO public.hero_slides (image_url, badge, title, subtitle, button_text, button_link, sort_order) VALUES
('https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1920&auto=format&fit=crop&q=85', 'Summer 2025', 'New Lawn Prints\nSummer Collection', 'Heritage craftsmanship. Contemporary elegance.', 'Shop Collection', '/collections/lawn-prints', 1),
('https://images.unsplash.com/photo-1609357605129-26f69add5d6e?w=1920&auto=format&fit=crop&q=85', 'Luxury Pret', 'Handcrafted Silk Sets\nTimeless Heritage', 'Indulge in premium raw silk fabrics and structured tailoring.', 'Explore Pret', '/collections/garments', 2),
('https://images.unsplash.com/photo-1529139574466-a303027c1d8b?w=1920&auto=format&fit=crop&q=85', 'New Arrivals', 'Elegance Reimagined\nFresh Off The Loom', 'Graceful silhouettes designed to make a statement.', 'View New Arrivals', '/collections', 3),
('https://images.unsplash.com/photo-1631049552057-403cdb8f0658?w=1920&auto=format&fit=crop&q=85', 'Bedding Collection', 'Supreme Luxury Bedding\nArt of Living', 'Transform your bedroom with our premium double sheets and duvet sets.', 'Shop Bedding', '/collections/bedding', 4),
('https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=1920&auto=format&fit=crop&q=85', 'Hijab Essentials', 'Pure Georgette Hijabs\nEveryday Grace', 'Breathable fabrics in curated colors for modern elegance.', 'Shop Hijabs', '/collections/hijab-collection', 5);

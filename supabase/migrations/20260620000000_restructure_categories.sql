-- ================================================
-- AYRA — CATEGORY RESTRUCTURE MIGRATION
-- Replaces old flat categories with the new
-- parent/sub-category hierarchy.
-- ================================================

-- ------------------------------------------------
-- 1. REMOVE OLD CATEGORY SEED DATA
--    (deactivate rather than delete so FK refs on
--     existing products are preserved until we
--     reassign them below)
-- ------------------------------------------------
UPDATE public.categories SET is_active = false
WHERE slug IN ('ready-to-wear', 'formal', 'pret', 'lawn');

-- ------------------------------------------------
-- 2. INSERT PARENT CATEGORIES
-- ------------------------------------------------
INSERT INTO public.categories (id, name, slug, description, parent_id, sort_order, is_active)
VALUES
    ('a1000000-0000-0000-0000-000000000001', 'Lawn Prints',      'lawn-prints',      'Premium quality lawn fabric suits — the perfect summer wardrobe.',   NULL, 1, true),
    ('a2000000-0000-0000-0000-000000000002', 'Garments',         'garments',         'Comfortable everyday garments for every occasion.',                  NULL, 2, true),
    ('a3000000-0000-0000-0000-000000000003', 'Bedding',          'bedding',          'Luxurious bed-sheets and bedding essentials for your home.',          NULL, 3, true),
    ('a4000000-0000-0000-0000-000000000004', 'Hijab Collection', 'hijab-collection', 'Elegant, lightweight hijabs for every style and occasion.',           NULL, 4, true)
ON CONFLICT (id) DO NOTHING;

-- ------------------------------------------------
-- 3. INSERT SUB-CATEGORIES
-- ------------------------------------------------
INSERT INTO public.categories (id, name, slug, description, parent_id, sort_order, is_active)
VALUES
    -- Lawn Prints sub-categories
    ('b1000000-0000-0000-0000-000000000001', '3-Piece',       'lawn-3-piece',       'Full 3-piece lawn suits — shirt, dupatta & trouser.',            'a1000000-0000-0000-0000-000000000001', 1, true),
    ('b1000000-0000-0000-0000-000000000002', '2-Piece',       'lawn-2-piece',       '2-piece lawn sets — shirt & dupatta.',                           'a1000000-0000-0000-0000-000000000001', 2, true),
    ('b1000000-0000-0000-0000-000000000003', 'Ready to Wear', 'lawn-ready-to-wear', 'Ready-stitched lawn ensembles, perfect out of the box.',         'a1000000-0000-0000-0000-000000000001', 3, true),

    -- Garments sub-categories
    ('b2000000-0000-0000-0000-000000000001', 'Intimate Wear', 'intimate-wear',      'Soft, breathable intimate wear crafted for all-day comfort.',     'a2000000-0000-0000-0000-000000000002', 1, true),
    ('b2000000-0000-0000-0000-000000000002', 'Sleep Wear',   'sleep-wear',          'Comfortable and stylish sleepwear collections.',                  'a2000000-0000-0000-0000-000000000002', 2, true),

    -- Bedding sub-categories
    ('b3000000-0000-0000-0000-000000000001', 'Single Bed-sheets', 'single-bedsheets', 'Premium single-bed sheet sets.',                              'a3000000-0000-0000-0000-000000000003', 1, true),
    ('b3000000-0000-0000-0000-000000000002', 'Double Bed-sheets', 'double-bedsheets', 'Luxury double-bed sheet sets.',                               'a3000000-0000-0000-0000-000000000003', 2, true),

    -- Hijab Collection sub-categories
    ('b4000000-0000-0000-0000-000000000001', 'Chiffon Hijabs', 'chiffon-hijabs', 'Lightweight chiffon hijabs in solid and ombre shades.',            'a4000000-0000-0000-0000-000000000004', 1, true),
    ('b4000000-0000-0000-0000-000000000002', 'Printed Hijabs', 'printed-hijabs', 'Floral, geometric and paisley printed hijabs.',                   'a4000000-0000-0000-0000-000000000004', 2, true)
ON CONFLICT (id) DO NOTHING;

-- ------------------------------------------------
-- 4. REASSIGN EXISTING PRODUCTS TO NEW CATEGORIES
--    (map old slugs → new sub-category IDs)
-- ------------------------------------------------

-- Terra Geometric Tunic (was 'lawn') → lawn-3-piece
UPDATE public.products
SET category_id = 'b1000000-0000-0000-0000-000000000001'
WHERE slug = 'terra-geometric-tunic';

-- Ivory Drape Dress (was 'ready-to-wear') → lawn-ready-to-wear
UPDATE public.products
SET category_id = 'b1000000-0000-0000-0000-000000000003'
WHERE slug = 'ivory-drape-dress';

-- Noir Silk Blouse (was 'pret') → sleep-wear (garment)
UPDATE public.products
SET category_id = 'b2000000-0000-0000-0000-000000000002'
WHERE slug = 'noir-silk-blouse';

-- Olive Linen Set (was 'pret') → intimate-wear (garment)
UPDATE public.products
SET category_id = 'b2000000-0000-0000-0000-000000000001'
WHERE slug = 'olive-linen-set';

-- Midnight Chiffon Suit (was 'formal') → chiffon-hijabs
UPDATE public.products
SET category_id = 'b4000000-0000-0000-0000-000000000001'
WHERE slug = 'midnight-chiffon-suit';

-- ------------------------------------------------
-- 5. SEED SAMPLE PRODUCTS FOR NEW CATEGORIES
--    (one representative per sub-category)
-- ------------------------------------------------
INSERT INTO public.products (id, name, slug, description, price, compare_at_price, sku, category_id, is_active, is_featured, fabric, color, includes, care_instructions)
VALUES
    -- Lawn 2-piece
    (
        'f6000000-0000-0000-0000-000000000001',
        'Blush Garden 2-Piece',
        'blush-garden-2-piece',
        'A delicate blush floral print lawn 2-piece set with embroidered neckline and printed dupatta.',
        4200.00, 5500.00, 'AYR-LWN-2P-01',
        'b1000000-0000-0000-0000-000000000002',
        true, true, 'Premium Lawn', 'Blush Pink', 'Shirt, Dupatta', 'Machine wash cold'
    ),
    -- Single Bed-sheets
    (
        'f7000000-0000-0000-0000-000000000001',
        'Ivory Satin Single Bed-sheet',
        'ivory-satin-single-bedsheet',
        'Silky smooth 300-thread-count satin single bed-sheet set with pillow covers.',
        2800.00, NULL, 'AYR-BED-SGL-01',
        'b3000000-0000-0000-0000-000000000001',
        true, true, 'Satin Cotton', 'Ivory White', 'Bed-sheet, 1 Pillow Cover', 'Gentle machine wash'
    ),
    -- Double Bed-sheets
    (
        'f8000000-0000-0000-0000-000000000001',
        'Noir Damask Double Bed-sheet',
        'noir-damask-double-bedsheet',
        'Elegant damask-pattern 400-thread-count double bed-sheet set with two pillow covers.',
        4500.00, 5800.00, 'AYR-BED-DBL-01',
        'b3000000-0000-0000-0000-000000000002',
        true, true, 'Egyptian Cotton', 'Charcoal Black', 'Bed-sheet, 2 Pillow Covers', 'Machine wash 30°C'
    ),
    -- Printed Hijabs
    (
        'f9000000-0000-0000-0000-000000000001',
        'Floral Garden Printed Hijab',
        'floral-garden-printed-hijab',
        'Soft jersey printed hijab in a vibrant floral garden print. Stays in place all day.',
        850.00, NULL, 'AYR-HIJ-PRN-01',
        'b4000000-0000-0000-0000-000000000002',
        true, true, 'Jersey', 'Multi-colour Floral', 'Hijab Only', 'Hand wash'
    )
ON CONFLICT (id) DO NOTHING;

-- ------------------------------------------------
-- 6. SEED IMAGES FOR NEW PRODUCTS
-- ------------------------------------------------
INSERT INTO public.product_images (product_id, url, alt_text, sort_order, is_primary)
VALUES
    ('f6000000-0000-0000-0000-000000000001', 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=600&auto=format&fit=crop&q=80', 'Blush Garden 2-Piece', 1, true),
    ('f7000000-0000-0000-0000-000000000001', 'https://images.unsplash.com/photo-1631049552057-403cdb8f0658?w=600&auto=format&fit=crop&q=80', 'Ivory Satin Single Bed-sheet', 1, true),
    ('f8000000-0000-0000-0000-000000000001', 'https://images.unsplash.com/photo-1631049552057-403cdb8f0658?w=600&auto=format&fit=crop&q=80', 'Noir Damask Double Bed-sheet', 1, true),
    ('f9000000-0000-0000-0000-000000000001', 'https://images.unsplash.com/photo-1609357605129-26f69add5d6e?w=600&auto=format&fit=crop&q=80', 'Floral Garden Printed Hijab', 1, true)
ON CONFLICT DO NOTHING;

-- ------------------------------------------------
-- 7. SEED VARIANTS FOR NEW PRODUCTS
-- ------------------------------------------------
INSERT INTO public.product_variants (product_id, size, stock_quantity, is_available)
VALUES
    -- Blush Garden 2-Piece (sizes are garment sizes)
    ('f6000000-0000-0000-0000-000000000001', 'S', 20, true),
    ('f6000000-0000-0000-0000-000000000001', 'M', 25, true),
    ('f6000000-0000-0000-0000-000000000001', 'L', 15, true),
    -- Bed-sheets use "Standard" as their size label
    ('f7000000-0000-0000-0000-000000000001', 'Standard', 30, true),
    ('f8000000-0000-0000-0000-000000000001', 'Standard', 20, true),
    -- Hijabs are one-size
    ('f9000000-0000-0000-0000-000000000001', 'One Size', 50, true)
ON CONFLICT (product_id, size) DO UPDATE
SET stock_quantity = EXCLUDED.stock_quantity, is_available = EXCLUDED.is_available;

-- ================================================
-- AYRA E-COMMERCE SEED DATA MIGRATION
-- ================================================

-- ---------- 1. Seed Categories ----------
INSERT INTO public.categories (id, name, slug, description, sort_order, is_active)
VALUES 
    ('01111111-1111-1111-1111-111111111111', 'Ready To Wear', 'ready-to-wear', 'Everyday ready luxury prêt.', 1, true),
    ('02222222-2222-2222-2222-222222222222', 'Luxury Formal', 'formal', 'Exquisite hand-embellished formal couture.', 2, true),
    ('03333333-3333-3333-3333-333333333333', 'Pret Collection', 'pret', 'Chic luxury daily pret wear.', 3, true),
    ('04444444-4444-4444-4444-444444444444', 'Summer Lawn', 'lawn', 'Lightweight premium lawn fabrics.', 4, true)
ON CONFLICT (id) DO NOTHING;

-- ---------- 2. Seed Products ----------
INSERT INTO public.products (id, name, slug, description, price, compare_at_price, sku, category_id, is_active, is_featured, fabric, color, includes, care_instructions)
VALUES
    (
        'f1111111-1111-1111-1111-111111111111', 
        'Noir Silk Blouse', 
        'noir-silk-blouse', 
        'A sleek black ready-to-wear blouse crafted from premium raw silk, featuring structured tailoring and elegant cuffs.', 
        18500.00, 
        22000.00, 
        'AYR-NOI-01', 
        '03333333-3333-3333-3333-333333333333', 
        true, 
        true, 
        'Raw Silk', 
        'Black', 
        'Blouse Only', 
        'Dry clean only'
    ),
    (
        'f2222222-2222-2222-2222-222222222222', 
        'Ivory Drape Dress', 
        'ivory-drape-dress', 
        'A flowing ivory white maxi dress with intricate hand-embroidered details, sheer panels, and keyhole necklines.', 
        32000.00, 
        NULL, 
        'AYR-IVO-02', 
        '01111111-1111-1111-1111-111111111111', 
        true, 
        true, 
        'Georgette Chiffon', 
        'Ivory White', 
        'Maxi Dress, Slip', 
        'Dry clean only'
    ),
    (
        'f3333333-3333-3333-3333-333333333333', 
        'Olive Linen Set', 
        'olive-linen-set', 
        'A modern relaxed-fit linen two-piece set in a rich olive tone with organic button details and tapered pants.', 
        21000.00, 
        25000.00, 
        'AYR-OLI-03', 
        '03333333-3333-3333-3333-333333333333', 
        true, 
        true, 
        'Premium Linen', 
        'Olive Green', 
        'Shirt, Trousers', 
        'Hand wash cold'
    ),
    (
        'f4444444-4444-4444-4444-444444444444', 
        'Terra Geometric Tunic', 
        'terra-geometric-tunic', 
        'A lightweight summer lawn tunic featuring abstract geometric print motifs, side slits, and detailed collar embroidery.', 
        9500.00, 
        NULL, 
        'AYR-TER-04', 
        '04444444-4444-4444-4444-444444444444', 
        true, 
        true, 
        'Lawn Cotton', 
        'Terracotta', 
        'Tunic Only', 
        'Gentle machine wash'
    ),
    (
        'f5555555-5555-5555-5555-555555555555', 
        'Midnight Chiffon Suit', 
        'midnight-chiffon-suit', 
        'Exude effortless elegance in this hand-embellished midnight chiffon suit. Features gold-threaded borders, zardozi embroidery and luxury lining slips.', 
        85000.00, 
        95000.00, 
        'AYR-MCF-05', 
        '02222222-2222-2222-2222-222222222222', 
        true, 
        true, 
        'Pure Chiffon', 
        'Midnight Black', 
        'Shirt, Dupatta, Trousers, Inner', 
        'Dry clean only'
    )
ON CONFLICT (id) DO NOTHING;

-- ---------- 3. Seed Product Images ----------
INSERT INTO public.product_images (product_id, url, alt_text, sort_order, is_primary)
VALUES
    -- Noir Silk Blouse
    ('f1111111-1111-1111-1111-111111111111', 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600&auto=format&fit=crop&q=80', 'Noir Silk Blouse Front', 1, true),
    ('f1111111-1111-1111-1111-111111111111', 'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?w=600&auto=format&fit=crop&q=80', 'Noir Silk Blouse Detail', 2, false),
    -- Ivory Drape Dress
    ('f2222222-2222-2222-2222-222222222222', 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=600&auto=format&fit=crop&q=80', 'Ivory Drape Dress Front', 1, true),
    -- Olive Linen Set
    ('f3333333-3333-3333-3333-333333333333', 'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=600&auto=format&fit=crop&q=80', 'Olive Linen Set Front', 1, true),
    -- Terra Geometric Tunic
    ('f4444444-4444-4444-4444-444444444444', 'https://images.unsplash.com/photo-1581044777550-4cfa60707c03?w=600&auto=format&fit=crop&q=80', 'Terra Geometric Tunic Front', 1, true),
    -- Midnight Chiffon Suit
    ('f5555555-5555-5555-5555-555555555555', 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=600&auto=format&fit=crop&q=80', 'Midnight Chiffon Suit Front', 1, true)
ON CONFLICT (id) DO NOTHING;

-- ---------- 4. Seed Product Variants (Sizes) ----------
INSERT INTO public.product_variants (product_id, size, stock_quantity, is_available)
VALUES
    -- Noir Silk Blouse (p1)
    ('f1111111-1111-1111-1111-111111111111', 'XS', 4, true),
    ('f1111111-1111-1111-1111-111111111111', 'S', 12, true),
    ('f1111111-1111-1111-1111-111111111111', 'M', 15, true),
    ('f1111111-1111-1111-1111-111111111111', 'L', 8, true),
    -- Ivory Drape Dress (p2)
    ('f2222222-2222-2222-2222-222222222222', 'S', 6, true),
    ('f2222222-2222-2222-2222-222222222222', 'M', 8, true),
    ('f2222222-2222-2222-2222-222222222222', 'L', 0, false),
    -- Olive Linen Set (p3)
    ('f3333333-3333-3333-3333-333333333333', 'S', 10, true),
    ('f3333333-3333-3333-3333-333333333333', 'M', 12, true),
    ('f3333333-3333-3333-3333-333333333333', 'L', 10, true),
    -- Terra Geometric Tunic (p4)
    ('f4444444-4444-4444-4444-444444444444', 'XS', 2, true),
    ('f4444444-4444-4444-4444-444444444444', 'S', 5, true),
    ('f4444444-4444-4444-4444-444444444444', 'M', 12, true),
    ('f4444444-4444-4444-4444-444444444444', 'L', 4, true),
    -- Midnight Chiffon Suit (p5)
    ('f5555555-5555-5555-5555-555555555555', 'S', 4, true),
    ('f5555555-5555-5555-5555-555555555555', 'M', 6, true),
    ('f5555555-5555-5555-5555-555555555555', 'L', 2, true)
ON CONFLICT (product_id, size) DO UPDATE 
SET stock_quantity = EXCLUDED.stock_quantity, is_available = EXCLUDED.is_available;

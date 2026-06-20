-- ---------- 11. Promo Codes Table ----------
CREATE TABLE IF NOT EXISTS public.promo_codes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code TEXT UNIQUE NOT NULL,
    discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'flat')),
    discount_value DECIMAL(12, 2) NOT NULL CHECK (discount_value >= 0),
    start_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true NOT NULL,
    applicable_category_ids UUID[] DEFAULT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on promo_codes
ALTER TABLE public.promo_codes ENABLE ROW LEVEL SECURITY;

-- Drop policies if they exist to prevent errors
DROP POLICY IF EXISTS "Anyone read active promo_codes" ON public.promo_codes;
DROP POLICY IF EXISTS "Admin write promo_codes" ON public.promo_codes;

-- Anyone read active promo_codes
CREATE POLICY "Anyone read active promo_codes" ON public.promo_codes
    FOR SELECT USING (is_active = true);

-- Admin write/manage promo_codes
CREATE POLICY "Admin write promo_codes" ON public.promo_codes
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE public.profiles.id = auth.uid() AND public.profiles.role = 'admin'
        )
    );

-- ---------- 12. Update Orders Table with Promo Code Fields ----------
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS promo_code TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS discount_amount DECIMAL(12, 2) DEFAULT 0.00 CHECK (discount_amount >= 0);

-- ================================================
-- Shipping management
-- ================================================

CREATE TABLE IF NOT EXISTS public.shipping_companies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    code TEXT NOT NULL UNIQUE,
    contact_person TEXT,
    phone TEXT,
    email TEXT,
    website_url TEXT,
    tracking_url_template TEXT,
    default_base_rate DECIMAL(12, 2) CHECK (default_base_rate IS NULL OR default_base_rate >= 0),
    cod_fee_type TEXT CHECK (cod_fee_type IS NULL OR cod_fee_type IN ('fixed', 'percentage')),
    cod_fee_value DECIMAL(12, 2) CHECK (cod_fee_value IS NULL OR cod_fee_value >= 0),
    is_active BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.order_shipments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id TEXT REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
    shipping_company_id UUID REFERENCES public.shipping_companies(id) ON DELETE SET NULL,
    shipping_company_name TEXT,
    shipment_direction TEXT DEFAULT 'forward' NOT NULL CHECK (shipment_direction IN ('forward', 'reverse')),
    tracking_number TEXT,
    tracking_url TEXT,
    booking_reference TEXT,
    shipment_status TEXT DEFAULT 'draft' NOT NULL CHECK (
        shipment_status IN (
            'draft',
            'booked',
            'picked_up',
            'in_transit',
            'out_for_delivery',
            'delivered',
            'failed_delivery',
            'returned',
            'cancelled'
        )
    ),
    shipping_cost DECIMAL(12, 2) DEFAULT 0 NOT NULL CHECK (shipping_cost >= 0),
    cod_amount DECIMAL(12, 2) DEFAULT 0 NOT NULL CHECK (cod_amount >= 0),
    weight_kg DECIMAL(10, 3) CHECK (weight_kg IS NULL OR weight_kg >= 0),
    pieces_count INT DEFAULT 1 NOT NULL CHECK (pieces_count > 0),
    package_notes TEXT,
    recipient_name TEXT NOT NULL,
    recipient_phone TEXT NOT NULL,
    recipient_city TEXT NOT NULL,
    recipient_address TEXT NOT NULL,
    recipient_postal_code TEXT,
    booked_at TIMESTAMP WITH TIME ZONE,
    shipped_at TIMESTAMP WITH TIME ZONE,
    estimated_delivery_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    returned_at TIMESTAMP WITH TIME ZONE,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    admin_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_shipping_companies_active ON public.shipping_companies(is_active);
CREATE INDEX IF NOT EXISTS idx_order_shipments_order_id ON public.order_shipments(order_id);
CREATE INDEX IF NOT EXISTS idx_order_shipments_status ON public.order_shipments(shipment_status);
CREATE INDEX IF NOT EXISTS idx_order_shipments_direction ON public.order_shipments(shipment_direction);

ALTER TABLE public.shipping_companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_shipments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone read shipping companies" ON public.shipping_companies
    FOR SELECT USING (true);

CREATE POLICY "Admin write shipping companies" ON public.shipping_companies
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE public.profiles.id = auth.uid() AND public.profiles.role = 'admin'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE public.profiles.id = auth.uid() AND public.profiles.role = 'admin'
        )
    );

CREATE POLICY "Admin manage shipments" ON public.order_shipments
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE public.profiles.id = auth.uid() AND public.profiles.role = 'admin'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE public.profiles.id = auth.uid() AND public.profiles.role = 'admin'
        )
    );

INSERT INTO public.shipping_companies (
    name,
    code,
    phone,
    website_url,
    tracking_url_template,
    default_base_rate,
    is_active
) VALUES
    ('Leopard Courier', 'leopard', NULL, 'https://www.leopardscourier.com', 'https://leetrace.leopardscourier.com/?track_numbers={tracking_number}', 250, true),
    ('TCS', 'tcs', NULL, 'https://www.tcsexpress.com', 'https://www.tcsexpress.com/track/{tracking_number}', 250, true),
    ('Trax', 'trax', NULL, 'https://trax.pk', 'https://trax.pk/tracking?tracking_number={tracking_number}', 250, true)
ON CONFLICT (code) DO NOTHING;

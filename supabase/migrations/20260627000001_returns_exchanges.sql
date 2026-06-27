-- ================================================
-- Returns and Exchanges Management
-- ================================================

CREATE TABLE IF NOT EXISTS public.order_return_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id TEXT REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
    request_type TEXT NOT NULL CHECK (request_type IN ('return', 'exchange', 'replacement')),
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'requested', 'approved', 'rejected', 'received', 'inspected', 'resolved', 'cancelled')),
    resolution_type TEXT CHECK (resolution_type IS NULL OR resolution_type IN ('refund', 'exchange_order', 'store_credit', 'no_action')),
    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    customer_email TEXT,
    reason TEXT NOT NULL,
    condition_notes TEXT,
    admin_notes TEXT,
    refund_amount DECIMAL(12, 2) DEFAULT 0 NOT NULL CHECK (refund_amount >= 0),
    store_credit_amount DECIMAL(12, 2) DEFAULT 0 NOT NULL CHECK (store_credit_amount >= 0),
    exchange_order_id TEXT REFERENCES public.orders(id) ON DELETE SET NULL,
    reverse_courier_name TEXT,
    reverse_tracking_number TEXT,
    reverse_tracking_url TEXT,
    requested_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    approved_at TIMESTAMP WITH TIME ZONE,
    received_at TIMESTAMP WITH TIME ZONE,
    resolved_at TIMESTAMP WITH TIME ZONE,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.order_return_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    return_request_id UUID REFERENCES public.order_return_requests(id) ON DELETE CASCADE NOT NULL,
    order_item_id UUID REFERENCES public.order_items(id) ON DELETE CASCADE NOT NULL,
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    variant_id UUID REFERENCES public.product_variants(id) ON DELETE SET NULL,
    quantity INT NOT NULL CHECK (quantity > 0),
    reason TEXT,
    condition_status TEXT NOT NULL DEFAULT 'unused' CHECK (condition_status IN ('unopened', 'unused', 'used', 'damaged', 'wrong_item', 'defective')),
    restock_action TEXT NOT NULL DEFAULT 'inspect_later' CHECK (restock_action IN ('restock', 'do_not_restock', 'inspect_later')),
    refund_amount DECIMAL(12, 2) DEFAULT 0 NOT NULL CHECK (refund_amount >= 0),
    exchange_product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    exchange_variant_id UUID REFERENCES public.product_variants(id) ON DELETE SET NULL,
    exchange_quantity INT CHECK (exchange_quantity IS NULL OR exchange_quantity > 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_order_return_requests_order_id ON public.order_return_requests(order_id);
CREATE INDEX IF NOT EXISTS idx_order_return_requests_status ON public.order_return_requests(status);
CREATE INDEX IF NOT EXISTS idx_order_return_requests_type ON public.order_return_requests(request_type);
CREATE INDEX IF NOT EXISTS idx_order_return_items_request_id ON public.order_return_items(return_request_id);
CREATE INDEX IF NOT EXISTS idx_order_return_items_order_item_id ON public.order_return_items(order_item_id);

ALTER TABLE public.order_return_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_return_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin manage return requests" ON public.order_return_requests
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

CREATE POLICY "Admin manage return items" ON public.order_return_items
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

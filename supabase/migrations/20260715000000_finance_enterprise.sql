-- ================================================
-- Enterprise Finance, Expenses & Treasury Schema
-- ================================================

-- 1. Expenses Management Table
CREATE TABLE IF NOT EXISTS public.expenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN (
        'marketing_ads',
        'fabric_materials',
        'packaging_supplies',
        'salaries_wages',
        'logistics_shipping',
        'rent_utilities',
        'software_tools',
        'office_maintenance',
        'taxes_legal',
        'miscellaneous'
    )),
    amount DECIMAL(12, 2) NOT NULL CHECK (amount >= 0),
    expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
    payment_method TEXT NOT NULL DEFAULT 'bank_transfer' CHECK (payment_method IN (
        'cash',
        'bank_transfer',
        'credit_card',
        'cheque',
        'other'
    )),
    vendor TEXT,
    reference_number TEXT,
    receipt_url TEXT,
    is_recurring BOOLEAN NOT NULL DEFAULT false,
    recurring_interval TEXT CHECK (recurring_interval IS NULL OR recurring_interval IN ('weekly', 'monthly', 'quarterly', 'yearly')),
    notes TEXT,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Financial Accounts / Treasury Table (Multi-Account tracking)
CREATE TABLE IF NOT EXISTS public.financial_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    account_type TEXT NOT NULL CHECK (account_type IN ('bank', 'cash_till', 'courier_wallet', 'other')),
    account_number TEXT,
    bank_name TEXT,
    balance DECIMAL(12, 2) NOT NULL DEFAULT 0,
    currency TEXT NOT NULL DEFAULT 'PKR',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Treasury Transfer Logs Table
CREATE TABLE IF NOT EXISTS public.treasury_transfers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    from_account_id UUID REFERENCES public.financial_accounts(id) ON DELETE RESTRICT NOT NULL,
    to_account_id UUID REFERENCES public.financial_accounts(id) ON DELETE RESTRICT NOT NULL,
    amount DECIMAL(12, 2) NOT NULL CHECK (amount > 0),
    transfer_date DATE NOT NULL DEFAULT CURRENT_DATE,
    reference_note TEXT,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Cost Price support on Products and Product Variants if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'products' AND column_name = 'cost_price') THEN
        ALTER TABLE public.products ADD COLUMN cost_price DECIMAL(12, 2);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'product_variants' AND column_name = 'cost_price') THEN
        ALTER TABLE public.product_variants ADD COLUMN cost_price DECIMAL(12, 2);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'order_items' AND column_name = 'is_gift') THEN
        ALTER TABLE public.order_items ADD COLUMN is_gift BOOLEAN DEFAULT false;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'order_items' AND column_name = 'gift_reason') THEN
        ALTER TABLE public.order_items ADD COLUMN gift_reason TEXT;
    END IF;
END $$;

-- 5. Indexes for fast aggregation
CREATE INDEX IF NOT EXISTS idx_expenses_date ON public.expenses(expense_date);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON public.expenses(category);
CREATE INDEX IF NOT EXISTS idx_expenses_created_at ON public.expenses(created_at);

-- 6. Row Level Security Policies
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.treasury_transfers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin manage expenses" ON public.expenses
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

CREATE POLICY "Admin manage financial accounts" ON public.financial_accounts
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

CREATE POLICY "Admin manage treasury transfers" ON public.treasury_transfers
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

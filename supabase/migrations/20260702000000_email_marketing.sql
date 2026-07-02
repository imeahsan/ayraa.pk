-- Email delivery settings and marketing campaign history.

ALTER TABLE public.store_settings
ADD COLUMN IF NOT EXISTS smtp_host TEXT,
ADD COLUMN IF NOT EXISTS smtp_port INT,
ADD COLUMN IF NOT EXISTS smtp_user TEXT,
ADD COLUMN IF NOT EXISTS smtp_pass TEXT,
ADD COLUMN IF NOT EXISTS email_from_address TEXT,
ADD COLUMN IF NOT EXISTS email_from_name TEXT;

CREATE TABLE IF NOT EXISTS public.email_marketing_campaigns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    subject TEXT NOT NULL,
    preheader TEXT,
    heading TEXT NOT NULL,
    body TEXT NOT NULL,
    hero_image_url TEXT,
    cta_label TEXT,
    cta_url TEXT,
    accent_color TEXT,
    footer_note TEXT,
    segment TEXT NOT NULL CHECK (segment IN ('all_customers', 'registered_customers', 'past_order_customers', 'custom')),
    recipient_count INT NOT NULL DEFAULT 0 CHECK (recipient_count >= 0),
    sent_count INT NOT NULL DEFAULT 0 CHECK (sent_count >= 0),
    failed_count INT NOT NULL DEFAULT 0 CHECK (failed_count >= 0),
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'test_sent', 'sent', 'partial_failure', 'failed')),
    error_log TEXT,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.email_marketing_campaigns ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin manage email marketing campaigns" ON public.email_marketing_campaigns;
CREATE POLICY "Admin manage email marketing campaigns" ON public.email_marketing_campaigns
    FOR ALL
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

CREATE INDEX IF NOT EXISTS idx_email_marketing_campaigns_created_at
    ON public.email_marketing_campaigns(created_at DESC);

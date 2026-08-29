-- Job Openings and Careers Management
-- Table for managing job postings displayed on the public /careers storefront

CREATE TABLE IF NOT EXISTS public.job_openings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    department TEXT NOT NULL DEFAULT 'General',
    location TEXT NOT NULL DEFAULT 'Lahore, Pakistan',
    employment_type TEXT NOT NULL DEFAULT 'Full-time',
    experience_level TEXT,
    description TEXT NOT NULL,
    requirements TEXT,
    responsibilities TEXT,
    benefits TEXT,
    salary_range TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    apply_email TEXT DEFAULT 'careers@ayraa.pk',
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.job_openings ENABLE ROW LEVEL SECURITY;

-- Public can view active job openings
DROP POLICY IF EXISTS "Public can view active job openings" ON public.job_openings;
CREATE POLICY "Public can view active job openings" ON public.job_openings
    FOR SELECT
    USING (is_active = true);

-- Admins can view and manage all job openings
DROP POLICY IF EXISTS "Admin manage job openings" ON public.job_openings;
CREATE POLICY "Admin manage job openings" ON public.job_openings
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

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_job_openings_active_sort
    ON public.job_openings(is_active, sort_order ASC, created_at DESC);

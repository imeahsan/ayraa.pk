ALTER TABLE public.categories
ADD COLUMN IF NOT EXISTS is_coming_soon BOOLEAN NOT NULL DEFAULT false;

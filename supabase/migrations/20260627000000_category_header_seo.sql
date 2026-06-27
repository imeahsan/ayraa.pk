ALTER TABLE public.categories
  ADD COLUMN IF NOT EXISTS show_in_header BOOLEAN DEFAULT false NOT NULL,
  ADD COLUMN IF NOT EXISTS header_label TEXT,
  ADD COLUMN IF NOT EXISTS meta_title TEXT,
  ADD COLUMN IF NOT EXISTS meta_description TEXT;

UPDATE public.categories
SET show_in_header = true
WHERE parent_id IS NULL
  AND is_active = true
  AND slug IN ('lawn-prints', 'garments', 'bedding', 'hijab-collection');

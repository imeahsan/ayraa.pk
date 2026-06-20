-- ---------- Add is_on_sale column to products ----------
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_on_sale BOOLEAN DEFAULT false NOT NULL;

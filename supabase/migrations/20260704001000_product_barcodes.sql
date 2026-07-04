CREATE TABLE IF NOT EXISTS public.product_barcodes (
  product_id UUID PRIMARY KEY REFERENCES public.products(id) ON DELETE CASCADE,
  barcode TEXT NOT NULL UNIQUE CHECK (length(trim(barcode)) > 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.product_barcodes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin manage product barcodes" ON public.product_barcodes;

CREATE POLICY "Admin manage product barcodes"
ON public.product_barcodes
FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

GRANT SELECT, INSERT, UPDATE, DELETE ON public.product_barcodes TO authenticated;

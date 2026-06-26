-- ---------- Wishlist Table ----------
CREATE TABLE IF NOT EXISTS public.wishlist_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE (user_id, product_id)
);

-- Enable RLS
ALTER TABLE public.wishlist_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users read own wishlist" ON public.wishlist_items;
DROP POLICY IF EXISTS "Users insert own wishlist" ON public.wishlist_items;
DROP POLICY IF EXISTS "Users delete own wishlist" ON public.wishlist_items;

CREATE POLICY "Users read own wishlist" ON public.wishlist_items
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users insert own wishlist" ON public.wishlist_items
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users delete own wishlist" ON public.wishlist_items
    FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS wishlist_items_user_id_idx ON public.wishlist_items (user_id);
CREATE INDEX IF NOT EXISTS wishlist_items_product_id_idx ON public.wishlist_items (product_id);

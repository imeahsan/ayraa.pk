-- ================================================
-- Reporting access support
-- ================================================

DROP POLICY IF EXISTS "Admin read wishlist items" ON public.wishlist_items;

CREATE POLICY "Admin read wishlist items" ON public.wishlist_items
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1
            FROM public.profiles
            WHERE public.profiles.id = auth.uid()
              AND public.profiles.role = 'admin'
        )
    );

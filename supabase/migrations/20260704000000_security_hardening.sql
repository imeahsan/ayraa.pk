-- Security hardening for public RLS policies and server-only checkout.

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid()
      AND role = 'admin'
  );
$$;

REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

DROP POLICY IF EXISTS "Public read profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users edit own profile" ON public.profiles;

CREATE POLICY "Users read own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Admins read profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (public.is_admin());

CREATE POLICY "Users update own safe profile fields"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

REVOKE UPDATE ON public.profiles FROM anon, authenticated;
GRANT UPDATE (full_name, phone, avatar_url) ON public.profiles TO authenticated;

DROP POLICY IF EXISTS "Anyone read settings" ON public.store_settings;
DROP POLICY IF EXISTS "Admin write settings" ON public.store_settings;
DROP POLICY IF EXISTS "Admin read settings" ON public.store_settings;
DROP POLICY IF EXISTS "Admin manage settings" ON public.store_settings;

CREATE OR REPLACE VIEW public.public_store_settings AS
SELECT
  id,
  brand_name,
  brand_description,
  contact_email,
  contact_phone,
  shipping_flat_rate,
  free_shipping_threshold,
  meta_title_template,
  meta_description,
  logo_url,
  favicon_url
FROM public.store_settings;

REVOKE ALL ON public.store_settings FROM anon;
GRANT SELECT ON public.public_store_settings TO anon, authenticated;

CREATE POLICY "Admin read settings"
ON public.store_settings
FOR SELECT
TO authenticated
USING (public.is_admin());

CREATE POLICY "Admin manage settings"
ON public.store_settings
FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Users view own orders" ON public.orders;
DROP POLICY IF EXISTS "Anyone insert order" ON public.orders;
DROP POLICY IF EXISTS "Users view own order items" ON public.order_items;
DROP POLICY IF EXISTS "Anyone insert order items" ON public.order_items;

CREATE POLICY "Users view own orders"
ON public.orders
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users view own order items"
ON public.order_items
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.orders
    WHERE orders.id = order_items.order_id
      AND orders.user_id = auth.uid()
  )
);

REVOKE INSERT ON public.orders FROM anon;
REVOKE INSERT ON public.order_items FROM anon;
GRANT INSERT ON public.orders TO authenticated;
GRANT INSERT ON public.order_items TO authenticated;

DROP POLICY IF EXISTS "Users insert own reviews" ON public.product_reviews;

REVOKE INSERT ON public.product_reviews FROM anon, authenticated;
GRANT INSERT ON public.product_reviews TO authenticated;

DROP POLICY IF EXISTS "Anyone insert captures" ON public.bedsheet_ar_captures;

CREATE POLICY "Users insert own captures"
ON public.bedsheet_ar_captures
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Anyone upload ar captures to storage" ON storage.objects;

CREATE POLICY "Users upload own ar captures"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'ar-captures'
  AND (storage.foldername(name))[1] = 'users'
  AND (storage.foldername(name))[2] = auth.uid()::text
);

UPDATE storage.buckets
SET
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/webp', 'image/jpeg', 'image/png']
WHERE id IN ('ar-captures', 'review-images');

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    'customer'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$;

REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC;

CREATE OR REPLACE FUNCTION public.create_checkout_order(
  p_user_id UUID,
  p_shipping_address JSONB,
  p_contact_phone TEXT,
  p_contact_email TEXT,
  p_city TEXT,
  p_items JSONB,
  p_promo_code TEXT DEFAULT NULL
)
RETURNS TABLE (
  order_id TEXT,
  subtotal NUMERIC,
  shipping_cost NUMERIC,
  discount_amount NUMERIC,
  total NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE
  v_item JSONB;
  v_product_id UUID;
  v_variant_id UUID;
  v_quantity INT;
  v_price NUMERIC;
  v_category_id UUID;
  v_stock_quantity INT;
  v_is_available BOOLEAN;
  v_subtotal NUMERIC := 0;
  v_shipping_cost NUMERIC := 250;
  v_free_shipping_threshold NUMERIC := 5000;
  v_discount_amount NUMERIC := 0;
  v_total NUMERIC := 0;
  v_order_id TEXT;
  v_order_items JSONB := '[]'::jsonb;
  v_promo public.promo_codes%ROWTYPE;
  v_eligible_subtotal NUMERIC := 0;
  v_line JSONB;
BEGIN
  IF jsonb_typeof(p_items) <> 'array' OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'Cart is empty.';
  END IF;

  FOR v_item IN SELECT value FROM jsonb_array_elements(p_items)
  LOOP
    v_product_id := (v_item->>'product_id')::UUID;
    v_variant_id := NULLIF(v_item->>'variant_id', '')::UUID;
    v_quantity := (v_item->>'quantity')::INT;

    IF v_quantity IS NULL OR v_quantity < 1 OR v_quantity > 20 THEN
      RAISE EXCEPTION 'Invalid item quantity.';
    END IF;

    IF v_variant_id IS NOT NULL THEN
      SELECT p.price, p.category_id, pv.stock_quantity, pv.is_available
      INTO v_price, v_category_id, v_stock_quantity, v_is_available
      FROM public.products p
      JOIN public.product_variants pv ON pv.product_id = p.id
      WHERE p.id = v_product_id
        AND p.is_active = true
        AND pv.id = v_variant_id
      FOR UPDATE OF pv;

      IF NOT FOUND OR v_is_available IS NOT TRUE OR v_stock_quantity < v_quantity THEN
        RAISE EXCEPTION 'One or more cart items are unavailable.';
      END IF;

      UPDATE public.product_variants
      SET stock_quantity = stock_quantity - v_quantity
      WHERE id = v_variant_id;
    ELSE
      SELECT price, category_id
      INTO v_price, v_category_id
      FROM public.products
      WHERE id = v_product_id
        AND is_active = true;

      IF NOT FOUND THEN
        RAISE EXCEPTION 'One or more cart items are unavailable.';
      END IF;
    END IF;

    v_subtotal := v_subtotal + (v_price * v_quantity);
    v_order_items := v_order_items || jsonb_build_object(
      'product_id', v_product_id,
      'variant_id', v_variant_id,
      'quantity', v_quantity,
      'unit_price', v_price,
      'category_id', v_category_id,
      'line_total', v_price * v_quantity
    );
  END LOOP;

  IF NULLIF(trim(p_promo_code), '') IS NOT NULL THEN
    SELECT *
    INTO v_promo
    FROM public.promo_codes
    WHERE upper(code) = upper(trim(p_promo_code))
      AND is_active = true
      AND (start_date IS NULL OR start_date <= now())
      AND (end_date IS NULL OR end_date >= now())
    LIMIT 1;

    IF FOUND THEN
      IF v_promo.applicable_category_ids IS NULL OR array_length(v_promo.applicable_category_ids, 1) IS NULL THEN
        v_eligible_subtotal := v_subtotal;
      ELSE
        FOR v_line IN SELECT value FROM jsonb_array_elements(v_order_items)
        LOOP
          IF (v_line->>'category_id')::UUID = ANY(v_promo.applicable_category_ids) THEN
            v_eligible_subtotal := v_eligible_subtotal + (v_line->>'line_total')::NUMERIC;
          END IF;
        END LOOP;
      END IF;

      IF v_eligible_subtotal > 0 THEN
        IF v_promo.discount_type = 'percentage' THEN
          v_discount_amount := floor(v_eligible_subtotal * (v_promo.discount_value / 100));
        ELSE
          v_discount_amount := least(v_promo.discount_value, v_eligible_subtotal);
        END IF;
      END IF;
    END IF;
  END IF;

  SELECT shipping_flat_rate, free_shipping_threshold
  INTO v_shipping_cost, v_free_shipping_threshold
  FROM public.store_settings
  WHERE id = 1;

  IF v_subtotal >= coalesce(v_free_shipping_threshold, 5000) THEN
    v_shipping_cost := 0;
  ELSE
    v_shipping_cost := coalesce(v_shipping_cost, 250);
  END IF;

  v_total := greatest(0, v_subtotal - v_discount_amount) + v_shipping_cost;

  INSERT INTO public.orders (
    user_id,
    status,
    payment_method,
    subtotal,
    shipping_cost,
    total,
    shipping_address,
    contact_phone,
    contact_email,
    city,
    promo_code,
    discount_amount
  )
  VALUES (
    p_user_id,
    'pending',
    'cod',
    v_subtotal,
    v_shipping_cost,
    v_total,
    p_shipping_address,
    p_contact_phone,
    p_contact_email,
    p_city,
    NULLIF(upper(trim(p_promo_code)), ''),
    v_discount_amount
  )
  RETURNING id INTO v_order_id;

  INSERT INTO public.order_items (order_id, product_id, variant_id, quantity, unit_price)
  SELECT
    v_order_id,
    (value->>'product_id')::UUID,
    NULLIF(value->>'variant_id', '')::UUID,
    (value->>'quantity')::INT,
    (value->>'unit_price')::NUMERIC
  FROM jsonb_array_elements(v_order_items);

  order_id := v_order_id;
  subtotal := v_subtotal;
  shipping_cost := v_shipping_cost;
  discount_amount := v_discount_amount;
  total := v_total;
  RETURN NEXT;
END;
$$;

REVOKE ALL ON FUNCTION public.create_checkout_order(UUID, JSONB, TEXT, TEXT, TEXT, JSONB, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_checkout_order(UUID, JSONB, TEXT, TEXT, TEXT, JSONB, TEXT) TO service_role;

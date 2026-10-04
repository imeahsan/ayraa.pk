-- Include line-level sale prices in the recorded discount amount.
-- The mobile client may lower a price, never raise it above the catalog price.

CREATE OR REPLACE FUNCTION public.record_mobile_pos_sale(
  p_items JSONB,
  p_payment_method TEXT DEFAULT 'cash',
  p_discount_amount NUMERIC DEFAULT 0,
  p_customer_name TEXT DEFAULT 'Walk-in Customer',
  p_customer_phone TEXT DEFAULT '0000000000',
  p_customer_email TEXT DEFAULT 'pos-guest@ayraa.pk',
  p_city TEXT DEFAULT 'Karachi'
)
RETURNS TABLE (order_id TEXT, subtotal NUMERIC, discount_amount NUMERIC, total NUMERIC)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE
  v_item JSONB;
  v_product_id UUID;
  v_variant_id UUID;
  v_quantity INT;
  v_regular_price NUMERIC;
  v_sale_price NUMERIC;
  v_stock INT;
  v_regular_subtotal NUMERIC := 0;
  v_sale_subtotal NUMERIC := 0;
  v_extra_discount NUMERIC := greatest(0, coalesce(p_discount_amount, 0));
  v_total_discount NUMERIC := 0;
  v_total NUMERIC;
  v_order_id TEXT;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Admin permissions required.' USING ERRCODE = '42501';
  END IF;
  IF jsonb_typeof(p_items) <> 'array' OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'Cart is empty.';
  END IF;
  IF p_payment_method NOT IN ('cash', 'card', 'bank_transfer', 'cod') THEN
    RAISE EXCEPTION 'Unsupported payment method.';
  END IF;

  FOR v_item IN SELECT value FROM jsonb_array_elements(p_items)
  LOOP
    v_product_id := (v_item->>'product_id')::UUID;
    v_variant_id := (v_item->>'variant_id')::UUID;
    v_quantity := (v_item->>'quantity')::INT;
    IF v_quantity IS NULL OR v_quantity < 1 OR v_quantity > 100 THEN
      RAISE EXCEPTION 'Invalid item quantity.';
    END IF;

    SELECT p.price, pv.stock_quantity
    INTO v_regular_price, v_stock
    FROM public.products p
    JOIN public.product_variants pv ON pv.product_id = p.id
    WHERE p.id = v_product_id
      AND pv.id = v_variant_id
      AND p.is_active = true
      AND pv.is_available = true
    FOR UPDATE OF pv;

    IF NOT FOUND OR v_stock < v_quantity THEN
      RAISE EXCEPTION 'Insufficient stock for one or more products.';
    END IF;

    v_sale_price := coalesce(nullif(v_item->>'unit_price', '')::NUMERIC, v_regular_price);
    IF v_sale_price < 0 OR v_sale_price > v_regular_price THEN
      RAISE EXCEPTION 'Sale price must be between zero and the regular price.';
    END IF;

    UPDATE public.product_variants
    SET stock_quantity = stock_quantity - v_quantity,
        is_available = (stock_quantity - v_quantity) > 0
    WHERE id = v_variant_id;

    v_regular_subtotal := v_regular_subtotal + (v_regular_price * v_quantity);
    v_sale_subtotal := v_sale_subtotal + (v_sale_price * v_quantity);
  END LOOP;

  v_extra_discount := least(v_extra_discount, v_sale_subtotal);
  v_total_discount := (v_regular_subtotal - v_sale_subtotal) + v_extra_discount;
  v_total := v_sale_subtotal - v_extra_discount;

  INSERT INTO public.orders (
    user_id, status, payment_method, subtotal, shipping_cost, total,
    discount_amount, shipping_address, contact_phone, contact_email, city
  ) VALUES (
    auth.uid(), 'delivered', p_payment_method, v_regular_subtotal, 0, v_total,
    v_total_discount,
    jsonb_build_object(
      'first_name', coalesce(nullif(trim(p_customer_name), ''), 'Walk-in'),
      'last_name', 'Customer',
      'address_line_1', 'In-store POS',
      'city', coalesce(nullif(trim(p_city), ''), 'Karachi'),
      'state', '',
      'country', 'Pakistan'
    ),
    coalesce(nullif(trim(p_customer_phone), ''), '0000000000'),
    coalesce(nullif(trim(p_customer_email), ''), 'pos-guest@ayraa.pk'),
    coalesce(nullif(trim(p_city), ''), 'Karachi')
  ) RETURNING id INTO v_order_id;

  INSERT INTO public.order_items (order_id, product_id, variant_id, quantity, unit_price)
  SELECT
    v_order_id,
    (value->>'product_id')::UUID,
    (value->>'variant_id')::UUID,
    (value->>'quantity')::INT,
    coalesce(nullif(value->>'unit_price', '')::NUMERIC, p.price)
  FROM jsonb_array_elements(p_items)
  JOIN public.products p ON p.id = (value->>'product_id')::UUID;

  order_id := v_order_id;
  subtotal := v_regular_subtotal;
  discount_amount := v_total_discount;
  total := v_total;
  RETURN NEXT;
END;
$$;

REVOKE ALL ON FUNCTION public.record_mobile_pos_sale(JSONB, TEXT, NUMERIC, TEXT, TEXT, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.record_mobile_pos_sale(JSONB, TEXT, NUMERIC, TEXT, TEXT, TEXT, TEXT) TO authenticated;

-- Update price, compare_at_price, and COGS (cost_price) for Single Bed-sheets collection
UPDATE products
SET
  price = 2750,
  compare_at_price = 3000,
  is_on_sale = true,
  cost_price = 1750
WHERE category_id = 'b3000000-0000-0000-0000-000000000001'
   OR sku ILIKE 'SBS-%';

UPDATE product_variants
SET cost_price = 1750
WHERE product_id IN (
  SELECT id FROM products
  WHERE category_id = 'b3000000-0000-0000-0000-000000000001'
     OR sku ILIKE 'SBS-%'
);

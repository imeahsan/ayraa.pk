-- Migration: Rename 100% Pure Cotton and variants to Cotton
UPDATE public.products
SET fabric = 'Cotton'
WHERE fabric ILIKE '%100% Pure Cotton%'
   OR fabric ILIKE 'Pure Cotton'
   OR fabric ILIKE '%100% Cotton%';

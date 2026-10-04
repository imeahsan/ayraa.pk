-- Migration: Rename Night Wears subcategory to Lounge Wear
UPDATE public.categories
SET name = 'Lounge Wear',
    slug = 'lounge-wear-collection'
WHERE id = '9545f0a1-dd82-4424-85f5-b2fdc52c6af5'
   OR slug = 'night-wears';

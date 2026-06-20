import { notFound } from 'next/navigation';
import BedsheetARExperience from '@/components/bedsheet-ar/BedsheetARExperience';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function BedsheetARPage({ params }: Props) {
  const { slug } = await params;
  const supabase = await createClient();

  // Fetch product by slug
  const { data: product, error } = await supabase
    .from('products')
    .select('*')
    .eq('slug', slug)
    .single();

  if (error || !product) {
    notFound();
  }

  // Verify that the product is enabled and ready for AR
  if (product.bedsheet_ar_status !== 'ready') {
    notFound();
  }

  return (
    <BedsheetARExperience
      productId={product.id}
      productName={product.name}
      productSlug={product.slug}
    />
  );
}

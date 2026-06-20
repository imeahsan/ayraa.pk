import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ productId: string }> }
) {
  try {
    const { productId } = await params;
    const supabase = await createClient();

    const { data: asset, error } = await supabase
      .from('bedsheet_ar_assets')
      .select('*')
      .eq('product_id', productId)
      .eq('is_active', true)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!asset) {
      return NextResponse.json({ error: 'AR asset not found or not active' }, { status: 404 });
    }

    return NextResponse.json({
      productId: asset.product_id,
      textureUrl: asset.texture_url,
      textureWidth: asset.texture_width,
      textureHeight: asset.texture_height,
      settings: {
        defaultOpacity: Number(asset.default_opacity),
        defaultScale: Number(asset.default_scale),
        defaultRotation: Number(asset.default_rotation),
        repeatMode: asset.repeat_mode,
      },
    });
  } catch (error: any) {
    console.error('Error fetching AR asset:', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}

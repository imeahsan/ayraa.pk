import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { processTexture } from '@/lib/bedsheet-ar/image';
import { AssetUploadSchema } from '@/lib/bedsheet-ar/validation';

export const dynamic = 'force-dynamic';

const MAX_TEXTURE_BYTES = 10 * 1024 * 1024;

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    // 1. Authenticate user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (!user || authError) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Validate role is admin
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // 3. Parse formData
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    
    // Validate inputs
    const validatedFields = AssetUploadSchema.safeParse({
      productId: formData.get('productId'),
      defaultOpacity: formData.get('defaultOpacity'),
      defaultScale: formData.get('defaultScale'),
      defaultRotation: formData.get('defaultRotation'),
      repeatMode: formData.get('repeatMode'),
    });

    if (!validatedFields.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validatedFields.error.flatten() },
        { status: 400 }
      );
    }

    const { productId, defaultOpacity, defaultScale, defaultRotation, repeatMode } =
      validatedFields.data;

    const hasFile = file && file instanceof File && file.size > 0;

    if (hasFile && file.size > MAX_TEXTURE_BYTES) {
      return NextResponse.json({ error: 'Texture image must be 10 MB or smaller' }, { status: 400 });
    }

    let textureUrl: string;
    let defaultTexturePath: string | null;
    let width: number;
    let height: number;
    let previousAsset: { texture_storage_path?: string | null } | null = null;

    if (hasFile) {
      const { data: existingAsset, error: existingAssetError } = await supabase
        .from('bedsheet_ar_assets')
        .select('texture_storage_path')
        .eq('product_id', productId)
        .maybeSingle();

      if (existingAssetError) {
        throw new Error(`Failed to check existing asset: ${existingAssetError.message}`);
      }

      previousAsset = existingAsset;

      // Convert file to buffer
      const arrayBuffer = await file.arrayBuffer();
      const fileBuffer = Buffer.from(arrayBuffer);

      // 4. Process image using Sharp
      const { original, sizes, width: w, height: h } = await processTexture(fileBuffer);
      width = w;
      height = h;

      const bucketName = 'product-ar-assets';
      const version = `${Date.now()}-${crypto.randomUUID().slice(0, 8)}`;

      // 5. Upload files to Supabase Storage
      // Upload original WebP
      const originalPath = `bedsheets/${productId}/texture-original-${version}.webp`;
      const { error: originalUploadError } = await supabase.storage
        .from(bucketName)
        .upload(originalPath, Buffer.from(original.buffer), {
          contentType: original.mimeType,
          cacheControl: '31536000',
        });

      if (originalUploadError) {
        throw new Error(`Failed to upload original texture: ${originalUploadError.message}`);
      }

      // Upload resized sizes (512, 1024, 2048)
      const uploadedSizes: Record<number, string> = {};
      for (const sizeStr of Object.keys(sizes)) {
        const size = Number(sizeStr);
        const sizePath = `bedsheets/${productId}/texture-${size}-${version}.webp`;
        const { error: sizeUploadError } = await supabase.storage
          .from(bucketName)
          .upload(sizePath, Buffer.from(sizes[size].buffer), {
            contentType: sizes[size].mimeType,
            cacheControl: '31536000',
          });

        if (sizeUploadError) {
          throw new Error(`Failed to upload texture size ${size}: ${sizeUploadError.message}`);
        }

        uploadedSizes[size] = sizePath;
      }

      // Get public URL of the 1024 default variant (or original fallback)
      defaultTexturePath = uploadedSizes[1024] || originalPath;
      const { data: urlData } = supabase.storage
        .from(bucketName)
        .getPublicUrl(defaultTexturePath);

      textureUrl = urlData.publicUrl;
    } else {
      // Check if asset already exists
      const { data: existingAsset, error: existingAssetError } = await supabase
        .from('bedsheet_ar_assets')
        .select('*')
        .eq('product_id', productId)
        .maybeSingle();

      if (existingAssetError) {
        throw new Error(`Failed to check existing asset: ${existingAssetError.message}`);
      }

      if (!existingAsset) {
        return NextResponse.json({ error: 'Missing texture file for new asset' }, { status: 400 });
      }

      textureUrl = existingAsset.texture_url;
      defaultTexturePath = existingAsset.texture_storage_path;
      width = existingAsset.texture_width;
      height = existingAsset.texture_height;
    }

    // 6. Save or update asset record in the database
    const { data: assetData, error: dbError } = await supabase
      .from('bedsheet_ar_assets')
      .upsert(
        {
          product_id: productId,
          texture_url: textureUrl,
          texture_storage_path: defaultTexturePath,
          texture_width: width,
          texture_height: height,
          default_opacity: defaultOpacity,
          default_scale: defaultScale,
          default_rotation: defaultRotation,
          repeat_mode: repeatMode,
          is_active: true,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'product_id' }
      )
      .select()
      .single();

    if (dbError) {
      throw new Error(`Database error saving asset: ${dbError.message}`);
    }

    // 7. Update products table to mark bedsheet_ar_status = 'ready'
    const { error: productUpdateError } = await supabase
      .from('products')
      .update({ bedsheet_ar_status: 'ready' })
      .eq('id', productId);

    if (productUpdateError) {
      throw new Error(`Database error updating product status: ${productUpdateError.message}`);
    }

    if (hasFile && previousAsset?.texture_storage_path) {
      const bucketName = 'product-ar-assets';
      const folder = `bedsheets/${productId}`;
      const { data: files } = await supabase.storage.from(bucketName).list(folder);
      const stalePaths = (files || [])
        .map((file) => `${folder}/${file.name}`)
        .filter((path) => path !== defaultTexturePath);

      if (stalePaths.length > 0) {
        const { error: cleanupError } = await supabase.storage.from(bucketName).remove(stalePaths);
        if (cleanupError) {
          console.warn('Failed to remove superseded AR assets:', cleanupError.message);
        }
      }
    }

    return NextResponse.json({
      success: true,
      asset: assetData,
    });
  } catch (error: any) {
    console.error('Error in AR assets route:', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}

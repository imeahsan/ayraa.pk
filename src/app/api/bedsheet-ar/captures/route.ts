import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

const MAX_CAPTURE_BYTES = 5 * 1024 * 1024;
const ALLOWED_CAPTURE_TYPES = new Set(['image/webp', 'image/jpeg', 'image/png']);

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const adminSupabase = createAdminClient();

    // 1. Get user session if any
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const userId = user?.id || null;

    // 2. Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const productId = formData.get('productId') as string | null;
    const cornerPointsStr = formData.get('cornerPoints') as string | null;
    const settingsStr = formData.get('settings') as string | null;

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: 'Missing image file' }, { status: 400 });
    }

    if (!ALLOWED_CAPTURE_TYPES.has(file.type)) {
      return NextResponse.json({ error: 'Unsupported image type' }, { status: 400 });
    }

    if (file.size > MAX_CAPTURE_BYTES) {
      return NextResponse.json({ error: 'Image file is too large' }, { status: 400 });
    }

    if (!productId) {
      return NextResponse.json({ error: 'Missing product ID' }, { status: 400 });
    }

    let cornerPoints = [];
    if (cornerPointsStr) {
      try {
        cornerPoints = JSON.parse(cornerPointsStr);
      } catch {
        return NextResponse.json({ error: 'Invalid cornerPoints JSON' }, { status: 400 });
      }
    }

    let settings = {};
    if (settingsStr) {
      try {
        settings = JSON.parse(settingsStr);
      } catch {
        return NextResponse.json({ error: 'Invalid settings JSON' }, { status: 400 });
      }
    }

    // Generate unique ID for capture
    const captureId = crypto.randomUUID();
    const sessionId = (settings as any).sessionId || crypto.randomUUID();

    // 3. Define storage path
    const pathPrefix = userId ? `users/${userId}` : `sessions/${sessionId}`;
    const storagePath = `${pathPrefix}/${productId}/${captureId}.webp`;

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 4. Upload to ar-captures bucket
    const { error: uploadError } = await adminSupabase.storage
      .from('ar-captures')
      .upload(storagePath, buffer, {
        contentType: file.type,
        upsert: true,
      });

    if (uploadError) {
      throw new Error(`Failed to upload capture: ${uploadError.message}`);
    }

    // 5. Generate signed URL for 1 hour (3600 seconds)
    const { data: signedUrlData, error: signedUrlError } = await adminSupabase.storage
      .from('ar-captures')
      .createSignedUrl(storagePath, 3600);

    if (signedUrlError || !signedUrlData) {
      throw new Error(`Failed to generate signed URL: ${signedUrlError?.message || 'unknown error'}`);
    }

    // 6. Insert capture record in DB
    const { data: captureData, error: dbError } = await adminSupabase
      .from('bedsheet_ar_captures')
      .insert({
        id: captureId,
        user_id: userId,
        session_id: sessionId,
        product_id: productId,
        input_type: 'live_camera',
        result_image_url: signedUrlData.signedUrl,
        result_storage_path: storagePath,
        corner_points: cornerPoints,
        settings: settings,
      })
      .select()
      .single();

    if (dbError) {
      throw new Error(`Database error saving capture: ${dbError.message}`);
    }

    return NextResponse.json({
      success: true,
      captureId: captureData.id,
      resultImageUrl: signedUrlData.signedUrl,
    });
  } catch (error: any) {
    console.error('Error in captures POST route:', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}

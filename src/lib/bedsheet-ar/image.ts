import sharp from 'sharp';

export interface ProcessedTexture {
  size: number | 'original';
  buffer: Buffer;
  mimeType: 'image/webp';
}

export async function processTexture(imageBuffer: Buffer): Promise<{
  original: ProcessedTexture;
  sizes: Record<number, ProcessedTexture>;
  width: number;
  height: number;
}> {
  const metadata = await sharp(imageBuffer).metadata();
  const width = metadata.width || 0;
  const height = metadata.height || 0;

  // Process original: auto-rotate and convert to WebP
  const originalBuffer = await sharp(imageBuffer)
    .rotate()
    .webp({ quality: 90 })
    .toBuffer();

  const targetSizes = [2048, 1024, 512];
  const sizeResults: Record<number, ProcessedTexture> = {};

  for (const size of targetSizes) {
    const resizedBuffer = await sharp(imageBuffer)
      .rotate()
      .resize(size, size, {
        fit: 'cover', // crop to square if not already square
      })
      .webp({ quality: 85 })
      .toBuffer();

    sizeResults[size] = {
      size,
      buffer: resizedBuffer,
      mimeType: 'image/webp',
    };
  }

  return {
    original: {
      size: 'original',
      buffer: originalBuffer,
      mimeType: 'image/webp',
    },
    sizes: sizeResults,
    width,
    height,
  };
}

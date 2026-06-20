import { CornerPoint, ARSettings } from './types';

/**
 * Draw a video frame on a canvas with CSS object-cover behavior
 */
export function drawVideoObjectCover(
  ctx: CanvasRenderingContext2D,
  video: HTMLVideoElement,
  canvasWidth: number,
  canvasHeight: number
) {
  const videoWidth = video.videoWidth;
  const videoHeight = video.videoHeight;

  const videoRatio = videoWidth / videoHeight;
  const canvasRatio = canvasWidth / canvasHeight;

  let sx = 0;
  let sy = 0;
  let sWidth = videoWidth;
  let sHeight = videoHeight;

  if (videoRatio > canvasRatio) {
    // Video is wider than canvas viewport
    sWidth = videoHeight * canvasRatio;
    sx = (videoWidth - sWidth) / 2;
  } else {
    // Video is taller than canvas viewport
    sHeight = videoWidth / canvasRatio;
    sy = (videoHeight - sHeight) / 2;
  }

  ctx.drawImage(
    video,
    sx,
    sy,
    sWidth,
    sHeight,
    0,
    0,
    canvasWidth,
    canvasHeight
  );
}

interface CompositeOptions {
  video: HTMLVideoElement;
  threeCanvas: HTMLCanvasElement;
  width: number;
  height: number;
}

/**
 * Composite the camera video stream and Three.js canvas into a single WebP Blob
 */
export function compositeARCapture({
  video,
  threeCanvas,
  width,
  height
}: CompositeOptions): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const pixelRatio = Math.min(window.devicePixelRatio, 2);
    
    // Use high resolution for saved capture
    canvas.width = width * pixelRatio;
    canvas.height = height * pixelRatio;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      reject(new Error('Could not get 2D rendering context'));
      return;
    }

    try {
      // 1. Draw video background with cover cropping
      drawVideoObjectCover(ctx, video, canvas.width, canvas.height);

      // 2. Draw WebGL canvas overlay
      ctx.drawImage(threeCanvas, 0, 0, canvas.width, canvas.height);

      // 3. Export to WebP Blob
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to convert canvas to blob'));
          }
        },
        'image/webp',
        0.92 // 92% quality WebP
      );
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Trigger browser file download for a blob
 */
export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Share file using Web Share API
 */
export async function shareARCapture(blob: Blob, filename: string, title: string): Promise<boolean> {
  if (
    typeof navigator !== 'undefined' &&
    navigator.share &&
    navigator.canShare
  ) {
    try {
      const file = new File([blob], filename, { type: 'image/webp' });
      if (navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: title,
          text: `Check out this bedsheet live preview of ${title}!`,
          files: [file]
        });
        return true;
      }
    } catch (error) {
      console.warn('Web Share failed, falling back to download:', error);
    }
  }
  return false;
}

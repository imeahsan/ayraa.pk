
# Mode 1 — Live Bedsheet AR Preview

## Purpose

Implement an instant, browser-based bedsheet live preview for a Next.js + Supabase ecommerce website.

This mode uses:

```txt
Live camera feed
+ manual 4-corner bed/mattress selection
+ WebGL/Three.js texture overlay
+ screenshot capture
```

This is the fastest production-friendly bedsheet AR mode because it does **not** require AI, GPU servers, or per-generation cost.

---

## 1. Final user experience

### Product page

For bedsheet products with AR enabled, show:

```txt
Preview on My Bed
```

### AR flow

```txt
1. User opens bedsheet product.
2. User taps "Preview on My Bed".
3. Browser asks camera permission.
4. Back camera opens.
5. User points camera at bed.
6. User taps 4 mattress corners:
   - top-left
   - top-right
   - bottom-right
   - bottom-left
7. Bedsheet texture appears live on bed.
8. User can:
   - adjust opacity
   - adjust pattern scale
   - rotate pattern
   - reset corners
   - capture preview
   - share/save preview
   - add product to cart
```

### UX positioning

This is not full AI photorealistic replacement. It is a live texture preview. Show copy such as:

```txt
Live preview is for visual reference only. Actual color, folds, size, and lighting may vary.
```

---

## 2. What this mode should and should not do

### Should do

- Open camera in browser.
- Load selected bedsheet product texture from Supabase.
- Let user manually select bed surface using 4 points.
- Render bedsheet texture onto selected quadrilateral.
- Run live at reasonable FPS.
- Work on Android Chrome and iPhone Safari.
- Allow reset and adjustment.
- Capture composited preview image.
- Optionally save captured preview to Supabase.
- Work without AI cost.

### Should not do in Phase 1

- Do not auto-detect bed using AI.
- Do not try to preserve pillows/objects on bed.
- Do not simulate wrinkles/folds automatically.
- Do not use WebXR unless specifically needed later.
- Do not require a native app.
- Do not call AI providers in live mode.

---

## 3. Recommended stack

### Existing stack

```txt
Next.js App Router
Supabase Postgres
Supabase Storage
TypeScript
Tailwind CSS or your existing CSS system
```

### New frontend libraries

```bash
npm install three
npm install zustand
npm install zod
```

Optional:

```bash
npm install @react-three/fiber
```

However, for this feature, raw `three` is recommended because the AR overlay is simple and you need exact pixel control.

### Why Three.js

Use Three.js because Canvas 2D does not provide clean perspective texture mapping into arbitrary quadrilaterals. With Three.js you can render a textured plane/mesh over the camera feed.

---

## 4. Browser APIs used

### Camera

Use:

```ts
navigator.mediaDevices.getUserMedia()
```

Important:

- Requires HTTPS in production.
- Works only in secure contexts.
- Must be called from a client component.
- Must handle permission denied.
- Must stop camera tracks when component unmounts.
- Use `playsInline` on iOS.
- Use `muted` and `autoPlay` for video.

### Screenshot capture

Use:

```ts
HTMLCanvasElement.toBlob()
```

Composite:

```txt
video frame canvas
+ rendered AR overlay canvas
= final preview image
```

---

## 5. Data model

### Minimum product columns

If you want minimal DB changes:

```sql
alter table products
add column ar_enabled boolean default false,
add column ar_type text,
add column bedsheet_texture_url text,
add column bedsheet_ar_default_opacity numeric default 0.85,
add column bedsheet_ar_default_scale numeric default 1.0,
add column bedsheet_ar_default_rotation numeric default 0;
```

### Recommended normalized table

```sql
create table bedsheet_ar_assets (
  id uuid primary key default gen_random_uuid(),

  product_id uuid not null references products(id) on delete cascade,

  texture_url text not null,
  texture_storage_path text,
  texture_width int,
  texture_height int,

  default_opacity numeric not null default 0.85,
  default_scale numeric not null default 1.0,
  default_rotation numeric not null default 0,

  repeat_mode text not null default 'repeat' check (
    repeat_mode in ('repeat', 'cover', 'contain')
  ),

  is_active boolean not null default true,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

### Optional captured previews table

```sql
create table bedsheet_ar_captures (
  id uuid primary key default gen_random_uuid(),

  user_id uuid references auth.users(id) on delete set null,
  session_id text,

  product_id uuid not null references products(id) on delete cascade,

  input_type text not null default 'live_camera',
  result_image_url text not null,
  result_storage_path text not null,

  corner_points jsonb not null default '[]',
  settings jsonb not null default '{}',

  created_at timestamptz not null default now()
);
```

Example `corner_points`:

```json
[
  { "x": 132, "y": 288, "label": "topLeft" },
  { "x": 824, "y": 302, "label": "topRight" },
  { "x": 933, "y": 691, "label": "bottomRight" },
  { "x": 79, "y": 675, "label": "bottomLeft" }
]
```

Example `settings`:

```json
{
  "opacity": 0.86,
  "scale": 1.15,
  "rotation": 0,
  "repeatMode": "repeat",
  "viewport": {
    "width": 1080,
    "height": 1920
  }
}
```

---

## 6. Supabase Storage buckets

Recommended buckets:

```txt
product-ar-assets
ar-captures
```

### Bucket visibility

```txt
product-ar-assets → public or private with signed URLs
ar-captures       → private
```

If product texture images are not sensitive, `product-ar-assets` can be public for faster CDN delivery.

If you want stricter control, keep it private and generate signed URLs from the server.

### Storage paths

```txt
product-ar-assets/
  bedsheets/{productId}/texture.webp
  bedsheets/{productId}/texture-1024.webp
  bedsheets/{productId}/texture-2048.webp

ar-captures/
  users/{userId}/{productId}/{captureId}.webp
  sessions/{sessionId}/{productId}/{captureId}.webp
```

---

## 7. Product asset requirements

### Ideal texture

The bedsheet texture should be:

```txt
Square or near-square
Front-facing
High resolution
No perspective distortion
No bed/background
No shadows
No watermark
WebP/PNG/JPG accepted
1024x1024 minimum
2048x2048 preferred
```

### If product image is not a clean texture

If you only have a styled bed image, do not use it directly as texture. Admin should crop/extract a flat design area or upload a separate texture.

### Recommended generated variants

On admin upload, create:

```txt
texture-original.webp
texture-2048.webp
texture-1024.webp
texture-512.webp
```

Use:

- 512 for low-end phones.
- 1024 default.
- 2048 for high-quality capture.

Image processing can be done with:

```bash
npm install sharp
```

Use `sharp` server-side only.

---

## 8. Route structure

```txt
src/
  app/
    products/
      [slug]/
        page.tsx
        bedsheet-ar/
          page.tsx

    api/
      bedsheet-ar/
        assets/
          [productId]/
            route.ts
        captures/
          route.ts

  components/
    bedsheet-ar/
      BedsheetARExperience.tsx
      CameraStream.tsx
      CornerSelector.tsx
      ThreeTextureOverlay.tsx
      ARControls.tsx
      CapturePreviewButton.tsx
      PermissionState.tsx
      ARInstructionOverlay.tsx

  lib/
    bedsheet-ar/
      types.ts
      geometry.ts
      camera.ts
      capture.ts
      texture.ts
      validation.ts

    supabase/
      client.ts
      server.ts
      admin.ts
```

---

## 9. API endpoints

### 9.1 Get AR asset for product

```http
GET /api/bedsheet-ar/assets/:productId
```

Response:

```json
{
  "productId": "uuid",
  "textureUrl": "https://...",
  "textureWidth": 1024,
  "textureHeight": 1024,
  "settings": {
    "defaultOpacity": 0.85,
    "defaultScale": 1,
    "defaultRotation": 0,
    "repeatMode": "repeat"
  }
}
```

Rules:

- Product must exist.
- Product must be AR-enabled.
- Product must have an active texture.
- If texture bucket is private, return signed URL.
- Signed URL should be valid long enough for the session, for example 15–60 minutes.

### 9.2 Save captured preview

```http
POST /api/bedsheet-ar/captures
```

Request:

```txt
multipart/form-data:
  file: preview.webp
  productId: uuid
  cornerPoints: JSON string
  settings: JSON string
```

Response:

```json
{
  "captureId": "uuid",
  "resultImageUrl": "signed-url-or-public-url"
}
```

Rules:

- Validate product.
- Validate image file type.
- Upload to `ar-captures`.
- Insert row in `bedsheet_ar_captures`.
- Return signed URL.

---

## 10. Frontend page

### `app/products/[slug]/bedsheet-ar/page.tsx`

Server component:

```tsx
import { notFound } from 'next/navigation';
import BedsheetARExperience from '@/components/bedsheet-ar/BedsheetARExperience';
import { getProductBySlug } from '@/lib/products';

export default async function BedsheetARPage({
  params
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) notFound();

  if (!product.ar_enabled || product.ar_type !== 'bedsheet_live') {
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
```

---

## 11. Client state model

Use Zustand or local React state.

```ts
export type CornerLabel = 'topLeft' | 'topRight' | 'bottomRight' | 'bottomLeft';

export type CornerPoint = {
  x: number;
  y: number;
  label: CornerLabel;
};

export type ARSettings = {
  opacity: number;
  scale: number;
  rotation: number;
  repeatMode: 'repeat' | 'cover' | 'contain';
};

export type CameraStatus =
  | 'idle'
  | 'requesting'
  | 'ready'
  | 'permission_denied'
  | 'not_supported'
  | 'error';

export type BedsheetARState = {
  cameraStatus: CameraStatus;
  textureUrl?: string;
  corners: CornerPoint[];
  settings: ARSettings;
  isOverlayReady: boolean;
};
```

---

## 12. Camera implementation

### `CameraStream.tsx`

Requirements:

- Client component.
- Use environment camera.
- Start on mount or button click.
- Return stream to parent.
- Handle iOS Safari issues.
- Stop stream on unmount.

```tsx
'use client';

import { useEffect, useRef, useState } from 'react';

type Props = {
  onReady?: (video: HTMLVideoElement, stream: MediaStream) => void;
  onError?: (error: Error) => void;
};

export function CameraStream({ onReady, onError }: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    let stream: MediaStream | null = null;
    let cancelled = false;

    async function start() {
      try {
        if (!navigator.mediaDevices?.getUserMedia) {
          throw new Error('Camera API not supported');
        }

        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: 'environment' },
            width: { ideal: 1280 },
            height: { ideal: 720 }
          },
          audio: false
        });

        if (cancelled) {
          stream.getTracks().forEach(track => track.stop());
          return;
        }

        const video = videoRef.current;
        if (!video) return;

        video.srcObject = stream;
        video.muted = true;
        video.playsInline = true;
        await video.play();

        setStarted(true);
        onReady?.(video, stream);
      } catch (err) {
        onError?.(err instanceof Error ? err : new Error('Camera failed'));
      }
    }

    start();

    return () => {
      cancelled = true;
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [onReady, onError]);

  return (
    <video
      ref={videoRef}
      autoPlay
      muted
      playsInline
      className="absolute inset-0 h-full w-full object-cover"
    />
  );
}
```

---

## 13. Coordinate system

This is critical.

The user taps on the displayed video area. The video may be using `object-cover`, so the CSS pixels do not always match the raw video pixels.

For overlay rendering, use **viewport/screen coordinates**, not raw video coordinates.

Recommended approach:

```txt
video element fills viewport with object-cover
Three.js renderer fills same viewport
corner points are stored in viewport CSS pixels
Three.js orthographic camera uses same CSS pixel coordinate system
```

### Orthographic camera setup

```ts
const camera = new THREE.OrthographicCamera(
  0,
  width,
  0,
  height,
  -1000,
  1000
);

camera.position.z = 10;
```

Because `top=0` and `bottom=height`, y increases downward. This matches DOM coordinates.

If the geometry appears vertically flipped, adjust either:

- camera top/bottom values, or
- y coordinate conversion, or
- UV mapping.

---

## 14. Corner selection

### UI rules

The app should guide the user:

```txt
Tap top-left corner
Tap top-right corner
Tap bottom-right corner
Tap bottom-left corner
```

After each tap, show marker number.

### Tap handling

Attach pointer handler to overlay container:

```tsx
function handlePointerDown(event: React.PointerEvent<HTMLDivElement>) {
  const rect = event.currentTarget.getBoundingClientRect();

  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;

  addCorner({ x, y });
}
```

### Allow dragging

After four points are selected, users should be able to drag each marker.

Implement:

```txt
pointerdown on marker
pointermove updates marker x/y
pointerup releases marker
```

### Hit radius

Use at least:

```txt
24px visual marker
40px touch target
```

---

## 15. Geometry rendering with Three.js

### Basic quadrilateral mesh

After four corners exist:

```ts
const positions = new Float32Array([
  topLeft.x, topLeft.y, 0,
  topRight.x, topRight.y, 0,
  bottomRight.x, bottomRight.y, 0,
  bottomLeft.x, bottomLeft.y, 0
]);

const uvs = new Float32Array([
  0, 0,
  1, 0,
  1, 1,
  0, 1
]);

const indices = [0, 1, 2, 0, 2, 3];
```

### Important issue: diagonal distortion

A simple quad split into two triangles can create visible diagonal distortion because each triangle interpolates texture coordinates affinely.

For better production quality, use a subdivided mesh.

### Recommended: subdivided grid mesh

Instead of 4 vertices, create a grid:

```txt
32 x 32 segments minimum
64 x 64 for high-end devices
```

Interpolate screen positions between the four selected corners.

Bilinear interpolation:

```ts
function bilerp(
  topLeft: Point,
  topRight: Point,
  bottomRight: Point,
  bottomLeft: Point,
  u: number,
  v: number
): Point {
  const top = {
    x: topLeft.x + (topRight.x - topLeft.x) * u,
    y: topLeft.y + (topRight.y - topLeft.y) * u
  };

  const bottom = {
    x: bottomLeft.x + (bottomRight.x - bottomLeft.x) * u,
    y: bottomLeft.y + (bottomRight.y - bottomLeft.y) * u
  };

  return {
    x: top.x + (bottom.x - top.x) * v,
    y: top.y + (bottom.y - top.y) * v
  };
}
```

Generate vertices for all grid points.

UV:

```ts
uv = [u * scale + offsetU, v * scale + offsetV]
```

Indices:

```ts
for each cell:
  a = row * cols + col
  b = a + 1
  c = a + cols
  d = c + 1

  triangles:
    a, b, d
    a, d, c
```

This reduces visible distortion.

---

## 16. Texture repeat, scale, and rotation

### Repeat

Set texture wrapping:

```ts
texture.wrapS = THREE.RepeatWrapping;
texture.wrapT = THREE.RepeatWrapping;
```

### Scale

For repeatable bedsheet textures:

```ts
texture.repeat.set(scale, scale);
```

But if you modify `texture.repeat`, the same texture instance affects all meshes. That is fine for one preview, but create/dispose texture carefully.

### Rotation

```ts
texture.center.set(0.5, 0.5);
texture.rotation = rotationInRadians;
```

### Opacity

```ts
material.opacity = settings.opacity;
material.transparent = true;
```

### Color realism

For an overlay look:

```ts
material = new THREE.MeshBasicMaterial({
  map: texture,
  transparent: true,
  opacity,
  depthTest: false,
  depthWrite: false
});
```

Do not use lighting in Phase 1 unless you add a 3D scene. This overlay is screen-space.

---

## 17. Three.js overlay component

### Requirements

- Renderer canvas must be transparent.
- Renderer must be above video.
- Renderer size must match displayed viewport.
- Re-render on:
  - animation frame
  - corner change
  - texture setting change
  - resize/orientation change

### Renderer setup

```ts
const renderer = new THREE.WebGLRenderer({
  alpha: true,
  antialias: true,
  preserveDrawingBuffer: true
});

renderer.setClearColor(0x000000, 0);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(width, height, false);
```

Use `preserveDrawingBuffer: true` if you need screenshot capture from the WebGL canvas. It may reduce performance slightly. Alternative: re-render to an offscreen target during capture.

### Animation loop

```ts
function animate() {
  renderer.render(scene, camera);
  rafId = requestAnimationFrame(animate);
}
```

### Cleanup

On unmount:

```ts
cancelAnimationFrame(rafId);
geometry.dispose();
material.dispose();
texture.dispose();
renderer.dispose();
```

Also remove renderer canvas from DOM.

---

## 18. Capture preview

### Need to capture both layers

The preview is composed of:

```txt
camera video frame
+ transparent Three.js canvas
```

### Method

Create hidden canvas:

```ts
const canvas = document.createElement('canvas');
canvas.width = outputWidth;
canvas.height = outputHeight;
const ctx = canvas.getContext('2d');
```

Draw video first:

```ts
ctx.drawImage(videoElement, 0, 0, outputWidth, outputHeight);
```

Then draw overlay canvas:

```ts
ctx.drawImage(threeRenderer.domElement, 0, 0, outputWidth, outputHeight);
```

Then convert:

```ts
canvas.toBlob(blob => {
  // upload blob
}, 'image/webp', 0.92);
```

### Critical issue: object-cover video

If video is displayed with `object-cover`, simple `drawImage(video, 0, 0, width, height)` may not match the displayed crop.

Implement object-cover drawing:

```ts
function drawVideoObjectCover(
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
    sWidth = videoHeight * canvasRatio;
    sx = (videoWidth - sWidth) / 2;
  } else {
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
```

---

## 19. Save/share capture

### Save to Supabase

Use route:

```txt
POST /api/bedsheet-ar/captures
```

Upload `Blob` as file:

```ts
const formData = new FormData();
formData.append('file', blob, 'bedsheet-preview.webp');
formData.append('productId', productId);
formData.append('cornerPoints', JSON.stringify(corners));
formData.append('settings', JSON.stringify(settings));

await fetch('/api/bedsheet-ar/captures', {
  method: 'POST',
  body: formData
});
```

### Web Share API

If supported:

```ts
if (navigator.share && navigator.canShare?.({ files: [file] })) {
  await navigator.share({
    title: productName,
    text: 'Preview this bedsheet on my bed',
    files: [file]
  });
}
```

Fallback:

```txt
Download image
Copy product link
WhatsApp share product URL
```

---

## 20. Admin panel

### Admin upload page

Path:

```txt
/admin/products/[id]/bedsheet-ar
```

Fields:

```txt
AR enabled
Texture image
Default opacity
Default scale
Default rotation
Repeat mode
Preview sample
```

### Validation

On upload:

```txt
file type: jpg/png/webp
min width: 800
min height: 800
max file size: 10MB before optimization
```

Process server-side:

```txt
strip metadata
convert to webp
generate sizes
store dimensions
```

### Admin readiness state

Add:

```sql
alter table products
add column bedsheet_ar_status text default 'not_ready' check (
  bedsheet_ar_status in ('not_ready', 'ready', 'disabled')
);
```

Only show `Preview on My Bed` if:

```ts
product.bedsheet_ar_status === 'ready'
```

---

## 21. Responsive/mobile details

### Layout

Use full-screen mobile layout:

```txt
fixed inset-0
video full screen
overlay full screen
bottom controls
top instruction bar
```

### Safe areas

Support iPhone notch/home indicator:

```css
padding-top: env(safe-area-inset-top);
padding-bottom: env(safe-area-inset-bottom);
```

### Orientation changes

On resize/orientation change:

```txt
recalculate viewport size
update Three.js renderer size
update camera projection
optionally scale existing corner points proportionally
```

Recommended scaling:

```ts
newX = oldX * (newWidth / oldWidth)
newY = oldY * (newHeight / oldHeight)
```

Store previous viewport dimensions.

---

## 22. Performance optimization

### Texture size

Use:

```txt
default: 1024x1024
high-end: 2048x2048
low-end: 512x512
```

Detection:

```ts
const isLowEnd =
  navigator.hardwareConcurrency <= 4 ||
  window.devicePixelRatio > 2.5;
```

### Renderer pixel ratio

```ts
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
```

### Mesh resolution

```txt
default grid: 32x32
high-end grid: 64x64
low-end grid: 16x16
```

### Avoid state churn

Do not update React state every animation frame. Three.js should render independently.

Use React state for settings and corners, but apply changes to geometry/material imperatively.

---

## 23. Edge cases and handling

### Camera permission denied

Show:

```txt
Camera permission is required for live preview. Please allow camera access from your browser settings.
```

Offer:

```txt
Upload room photo instead
```

This can later route to Mode 2 AI preview.

### Camera unsupported

Show fallback:

```txt
Your browser does not support live camera preview. Please try Chrome/Safari or upload a room photo.
```

### Texture failed to load

Show:

```txt
Bedsheet preview is currently unavailable for this product.
```

Log to monitoring.

### User taps wrong corner

Allow:

```txt
Undo last point
Reset all corners
Drag markers
```

### Bad bed angle

Show tip:

```txt
Try capturing the bed from the foot side or side angle with the full mattress visible.
```

---

## 24. Quality limitations

Live mode cannot automatically handle:

```txt
pillows
blankets
wrinkles
shadows
occlusion
people/pets on bed
complex bed edges
curved blankets
messy rooms
```

Mitigate with instructions:

```txt
For best result, keep the mattress clearly visible and remove pillows/blankets from the preview area.
```

---

## 25. Security and privacy

### Camera

Live camera stream should remain local unless user captures and uploads.

Do not upload frames automatically.

### Captures

If user saves preview:

```txt
Upload only the final captured image
Use private bucket if tied to user
Allow delete
Expire guest captures after X days
```

### Storage cleanup

Use scheduled cleanup:

```sql
delete from bedsheet_ar_captures
where user_id is null
and created_at < now() - interval '7 days';
```

Also delete corresponding storage objects through scheduled server job.

---

## 26. Analytics events

Track:

```txt
bedsheet_ar_opened
camera_permission_granted
camera_permission_denied
corner_1_selected
corner_4_selected
preview_rendered
opacity_changed
scale_changed
rotation_changed
preview_captured
preview_shared
add_to_cart_from_ar
ar_reset
```

Useful properties:

```json
{
  "productId": "uuid",
  "device": "mobile",
  "browser": "safari",
  "textureSize": 1024,
  "timeToFirstPreviewMs": 8200
}
```

---

## 27. Testing checklist

### Device/browser

Test:

```txt
Android Chrome
Android Samsung Internet
iPhone Safari
iPhone Chrome
Desktop Chrome
Desktop Safari
```

### Functional tests

```txt
Camera opens
Camera stops on route leave
Texture loads
4 taps create overlay
Markers drag correctly
Reset works
Opacity works
Scale works
Rotation works
Capture works
Upload capture works
Add to cart button works
Orientation change does not break layout
Back button stops camera
```

### Visual tests

```txt
Texture not upside down
Texture not mirrored
Overlay follows selected corners
No large diagonal seam
Opacity acceptable
UI controls visible on small screens
Instruction text readable
```

### Performance tests

```txt
FPS acceptable on mid-range Android
No memory leak after repeated opens/closes
Texture disposed on product change
Renderer disposed on unmount
No camera stream remains active after exit
```

---

## 28. Implementation task breakdown for coding agent

### Task 1: Database

- Add `bedsheet_ar_assets`.
- Add `bedsheet_ar_captures`.
- Add product status columns.
- Add RLS policies.

### Task 2: Storage

- Create `product-ar-assets` bucket.
- Create `ar-captures` bucket.
- Implement upload helper.
- Implement signed URL helper.

### Task 3: Admin upload

- Build admin page.
- Upload texture.
- Validate image.
- Convert to WebP.
- Generate 512/1024/2048 variants.
- Save DB row.
- Mark AR ready.

### Task 4: Product integration

- Show `Preview on My Bed` button only for ready products.
- Link to `/products/[slug]/bedsheet-ar`.

### Task 5: Camera

- Build `CameraStream`.
- Implement error states.
- Stop stream on unmount.

### Task 6: Corner selection

- Build `CornerSelector`.
- Add guided tap order.
- Add markers.
- Add drag support.
- Add undo/reset.

### Task 7: Three.js overlay

- Build `ThreeTextureOverlay`.
- Use transparent renderer.
- Use orthographic camera.
- Load texture.
- Create subdivided grid mesh.
- Support opacity/scale/rotation.
- Handle resize.
- Dispose resources.

### Task 8: Capture

- Composite video + WebGL canvas.
- Convert to WebP.
- Save locally or upload.
- Implement share/download fallback.

### Task 9: QA and hardening

- Add analytics.
- Add privacy copy.
- Add unsupported browser fallback.
- Test iOS/Android.

---

## 29. Suggested acceptance criteria

The feature is ready when:

```txt
1. Admin can upload bedsheet texture for a product.
2. Product page shows AR button only when AR is ready.
3. Mobile user can open camera.
4. User can select 4 bed corners.
5. Texture renders live on selected bed area.
6. User can adjust opacity, scale, rotation.
7. User can reset/drag corners.
8. User can capture final image.
9. Camera stops after leaving page.
10. Works on Android Chrome and iPhone Safari.
11. No AI/API cost is required for live previews.
```

---

## 30. Reference documentation

These are useful implementation references:

- Next.js Route Handlers: https://nextjs.org/docs/app/api-reference/file-conventions/route
- MDN `getUserMedia`: https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia
- Three.js docs: https://threejs.org/docs/
- Three.js Texture docs: https://threejs.org/docs/pages/Texture.html
- Supabase Storage: https://supabase.com/docs/guides/storage
- Supabase Storage uploads: https://supabase.com/docs/guides/storage/uploads/standard-uploads
- Supabase signed URLs: https://supabase.com/docs/guides/storage/buckets/fundamentals

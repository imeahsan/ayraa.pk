# Mode 2 — AI Realistic Bedsheet Preview

## Purpose

Implement a production-grade AI bedsheet preview system for a Next.js + Supabase ecommerce website.

This mode uses:

```txt
Customer room/bed photo
+ product bedsheet texture/reference image
+ AI image editing/provider API
+ async job processing
+ stored result preview
```

Compared with Mode 1 live AR, this mode is slower but can produce more realistic results with better shadows, folds, bed shape adaptation, and object preservation.

---

## 1. Final user experience

### Product page

For bedsheet products with AI preview enabled, show:

```txt
Generate Realistic Preview
```

Optional labels:

```txt
AI Preview
Realistic Preview
Preview on My Bed
```

### AI preview flow

```txt
1. User opens bedsheet product.
2. User taps "Generate Realistic Preview".
3. User uploads/takes a room photo with bed visible.
4. App validates image.
5. Backend creates AI preview job.
6. User sees "Generating preview" screen.
7. Frontend polls job status.
8. AI result is stored in Supabase.
9. User sees before/after preview.
10. User can save/share/add to cart.
```

### UX copy

```txt
Upload a clear photo of your bed. AI will apply this bedsheet design to your bed.
```

Disclaimer:

```txt
AI preview is for visual reference only. Actual color, size, folds, lighting, and fabric appearance may vary.
```

---

## 2. What this mode should and should not do

### Should do

- Accept user uploaded/captured bed photo.
- Validate file type, size, and dimensions.
- Store input image privately.
- Create async job in DB.
- Queue background processing.
- Call AI provider from backend only.
- Use bedsheet product texture/reference image.
- Store AI-generated result.
- Poll job status from frontend.
- Show before/after result.
- Enforce rate limits and cost controls.
- Allow user to delete preview.
- Log provider errors.

### Should not do

- Do not call AI provider directly from frontend.
- Do not expose provider API keys to client.
- Do not block HTTP request until generation finishes.
- Do not allow unlimited guest previews.
- Do not store bedroom/user photos in public buckets.
- Do not assume every product image is a good texture.

---

## 3. Recommended stack

### Existing stack

```txt
Next.js App Router
Supabase Postgres
Supabase Storage
Supabase Auth
TypeScript
```

### Additional backend libraries

```bash
npm install zod
npm install sharp
npm install nanoid
```

Optional queue/worker libraries if not using Supabase Queues:

```bash
npm install bullmq ioredis
```

If using Supabase Queues:

```txt
No Redis required.
Use Supabase/Postgres-backed queue.
```

### Recommended production queue

Use one of:

```txt
Option A: Supabase Queues
Option B: BullMQ + Redis
Option C: External worker platform
Option D: Supabase Edge Function background tasks for lightweight jobs
```

For AI generation jobs that may take time, a durable queue is strongly preferred.

---

## 4. High-level architecture

```txt
Next.js frontend
  ↓
Upload input image
  ↓
Next.js API route
  ↓
Supabase Storage: ar-user-inputs
  ↓
Create ar_preview_jobs row
  ↓
Push queue message
  ↓
Worker picks job
  ↓
Worker gets signed URLs for input/product assets
  ↓
Worker calls AI provider
  ↓
Worker uploads result to Supabase Storage: ar-results
  ↓
Worker marks job completed
  ↓
Frontend polls job status
  ↓
User views result
```

---

## 5. Provider strategy

Do not hard-code one provider into your app. Build a provider abstraction.

### Provider categories

```txt
1. AI image editing provider
2. AI interior/room visualizer provider
3. Custom Stable Diffusion/ControlNet/Inpainting service
4. Future in-house GPU model
```

### Provider interface

```ts
export interface BedsheetAIProvider {
  key: string;

  generateBedsheetPreview(
    input: BedsheetPreviewProviderInput
  ): Promise<BedsheetPreviewProviderResult>;
}

export type BedsheetPreviewProviderInput = {
  jobId: string;
  roomImageUrl: string;
  bedsheetTextureUrl: string;
  styledReferenceUrl?: string;
  productName: string;
  prompt: string;
  negativePrompt?: string;
  metadata?: Record<string, unknown>;
};

export type BedsheetPreviewProviderResult = {
  imageUrl?: string;
  imageBuffer?: Buffer;
  providerJobId?: string;
  rawResponse?: unknown;
};
```

### Provider selection logic

```txt
1. Use active provider from ar_provider_configs.
2. If provider fails with retryable error, retry same provider.
3. If still fails, optionally fallback to secondary provider.
4. Store provider name, provider job id, and raw response.
```

---

## 6. Database schema

### 6.1 Product AI assets

```sql
create table bedsheet_ai_assets (
  id uuid primary key default gen_random_uuid(),

  product_id uuid not null references products(id) on delete cascade,

  texture_url text not null,
  texture_storage_path text,

  flat_product_url text,
  flat_product_storage_path text,

  styled_bed_reference_url text,
  styled_bed_reference_storage_path text,

  texture_width int,
  texture_height int,

  default_prompt text,
  negative_prompt text,

  is_active boolean not null default true,
  quality_status text not null default 'not_reviewed' check (
    quality_status in ('not_reviewed', 'approved', 'rejected', 'needs_better_texture')
  ),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

### 6.2 Preview jobs

```sql
create table ar_preview_jobs (
  id uuid primary key default gen_random_uuid(),

  user_id uuid references auth.users(id) on delete set null,
  session_id text,

  product_id uuid not null references products(id) on delete cascade,

  ar_type text not null check (
    ar_type in ('bedsheet_ai_preview')
  ),

  input_image_url text not null,
  input_storage_path text not null,
  input_image_hash text,

  result_image_url text,
  result_storage_path text,

  status text not null default 'pending' check (
    status in ('pending', 'queued', 'processing', 'completed', 'failed', 'cancelled', 'expired')
  ),

  provider text,
  provider_job_id text,

  request_payload jsonb not null default '{}',
  provider_response jsonb not null default '{}',

  attempts int not null default 0,
  max_attempts int not null default 2,

  error_code text,
  error_message text,

  started_at timestamptz,
  completed_at timestamptz,
  expires_at timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

### 6.3 Usage logs

```sql
create table ar_usage_logs (
  id uuid primary key default gen_random_uuid(),

  user_id uuid references auth.users(id) on delete set null,
  session_id text,

  product_id uuid references products(id) on delete cascade,
  job_id uuid references ar_preview_jobs(id) on delete set null,

  ar_type text not null,
  action text not null check (
    action in ('created', 'completed', 'failed', 'cached_result_returned')
  ),

  ip_hash text,
  user_agent text,

  created_at timestamptz not null default now()
);
```

### 6.4 Provider config

```sql
create table ar_provider_configs (
  id uuid primary key default gen_random_uuid(),

  provider_key text not null unique,
  provider_type text not null check (
    provider_type in ('bedsheet_ai_preview')
  ),

  display_name text not null,
  is_active boolean not null default false,
  priority int not null default 100,

  timeout_seconds int not null default 120,
  max_retries int not null default 2,

  config jsonb not null default '{}',

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

### 6.5 Optional provider quality feedback

```sql
create table ar_preview_feedback (
  id uuid primary key default gen_random_uuid(),

  job_id uuid not null references ar_preview_jobs(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,

  rating int check (rating between 1 and 5),
  feedback_text text,
  issue_tags text[],

  created_at timestamptz not null default now()
);
```

---

## 7. Supabase Storage buckets

Recommended buckets:

```txt
product-ar-assets
ar-user-inputs
ar-results
```

### Visibility

```txt
product-ar-assets → public or private
ar-user-inputs    → private
ar-results        → private
```

Use signed URLs for private images.

### Paths

```txt
product-ar-assets/
  bedsheets/{productId}/texture.webp
  bedsheets/{productId}/flat-product.webp
  bedsheets/{productId}/styled-reference.webp

ar-user-inputs/
  users/{userId}/{jobId}/input.webp
  sessions/{sessionId}/{jobId}/input.webp

ar-results/
  users/{userId}/{jobId}/result.webp
  sessions/{sessionId}/{jobId}/result.webp
```

### Expiry policy

```txt
guest input images: delete after 24 hours
guest result images: delete after 7 days
logged-in previews: delete after 30 days unless saved
saved previews: keep until user deletes
```

---

## 8. API endpoints

### 8.1 Upload input image

```http
POST /api/ar/bedsheet/upload-input
```

Request:

```txt
multipart/form-data
  file: image
  productId: uuid
```

Response:

```json
{
  "inputStoragePath": "ar-user-inputs/users/.../input.webp",
  "inputImageUrl": "signed-url",
  "inputImageHash": "sha256..."
}
```

Server responsibilities:

```txt
1. Authenticate if possible.
2. Create session id for guest if needed.
3. Validate product exists and AI preview enabled.
4. Validate image type.
5. Validate max file size.
6. Strip EXIF metadata.
7. Resize/compress image.
8. Convert to WebP.
9. Hash normalized image.
10. Upload to private Supabase bucket.
11. Return storage path and signed URL.
```

Validation defaults:

```txt
Allowed types: image/jpeg, image/png, image/webp
Max upload size before processing: 12MB
Min width: 640
Min height: 640
Max output long edge: 1536 or 2048
Output format: WebP
Output quality: 88–92
```

---

### 8.2 Create preview job

```http
POST /api/ar/bedsheet/preview-jobs
```

Request:

```json
{
  "productId": "uuid",
  "inputStoragePath": "ar-user-inputs/users/.../input.webp",
  "inputImageHash": "sha256...",
  "options": {
    "preservePillows": true,
    "style": "realistic"
  }
}
```

Response:

```json
{
  "jobId": "uuid",
  "status": "queued"
}
```

Server responsibilities:

```txt
1. Validate request with Zod.
2. Validate product and AI assets.
3. Check usage limits.
4. Check cache for same image/product.
5. Create job row.
6. Push queue message.
7. Insert usage log.
8. Return job id.
```

---

### 8.3 Check job status

```http
GET /api/ar/bedsheet/preview-jobs/:jobId
```

Response while processing:

```json
{
  "jobId": "uuid",
  "status": "processing",
  "message": "Generating your preview..."
}
```

Response completed:

```json
{
  "jobId": "uuid",
  "status": "completed",
  "resultImageUrl": "signed-url",
  "inputImageUrl": "signed-url"
}
```

Response failed:

```json
{
  "jobId": "uuid",
  "status": "failed",
  "errorCode": "BED_NOT_CLEAR",
  "errorMessage": "We could not clearly detect the bed. Please upload a clearer photo."
}
```

---

### 8.4 Delete preview

```http
DELETE /api/ar/bedsheet/preview-jobs/:jobId
```

Responsibilities:

```txt
1. Verify user/session owns job.
2. Delete input image if allowed.
3. Delete result image if exists.
4. Mark job cancelled or expired.
```

---

## 9. Frontend route structure

```txt
src/
  app/
    products/
      [slug]/
        page.tsx
        bedsheet-ai-preview/
          page.tsx

    api/
      ar/
        bedsheet/
          upload-input/
            route.ts
          preview-jobs/
            route.ts
          preview-jobs/
            [jobId]/
              route.ts

  components/
    bedsheet-ai/
      BedsheetAIPreviewExperience.tsx
      BedPhotoUploader.tsx
      BedPhotoGuidelines.tsx
      AIPreviewSubmit.tsx
      AIPreviewStatus.tsx
      AIPreviewResult.tsx
      BeforeAfterSlider.tsx
      PreviewFeedback.tsx
      PreviewPrivacyNotice.tsx

  lib/
    ar/
      bedsheet-ai/
        types.ts
        prompts.ts
        validation.ts
        usage-limits.ts
        job-cache.ts
        create-job.ts
        process-job.ts
        provider-factory.ts
        providers/
          base.ts
          mock-provider.ts
          generic-image-edit-provider.ts
          room-visualizer-provider.ts

    storage/
      upload-image.ts
      signed-url.ts
      delete-object.ts

    image/
      normalize-image.ts
      hash-image.ts
```

---

## 10. Frontend component flow

### Main component

```tsx
'use client';

export function BedsheetAIPreviewExperience({
  productId,
  productName
}: {
  productId: string;
  productName: string;
}) {
  // states:
  // selectedFile
  // uploadedInput
  // jobId
  // jobStatus
  // resultImageUrl
  // error
}
```

### UI states

```txt
idle
photo_selected
uploading
uploaded
creating_job
queued
processing
completed
failed
```

### Polling

```ts
useEffect(() => {
  if (!jobId) return;

  const interval = window.setInterval(async () => {
    const res = await fetch(`/api/ar/bedsheet/preview-jobs/${jobId}`);
    const data = await res.json();

    setJobStatus(data.status);

    if (data.status === 'completed') {
      setResultImageUrl(data.resultImageUrl);
      clearInterval(interval);
    }

    if (data.status === 'failed') {
      setError(data.errorMessage);
      clearInterval(interval);
    }
  }, 3000);

  return () => clearInterval(interval);
}, [jobId]);
```

### Stop polling

Stop when:

```txt
completed
failed
cancelled
component unmounted
```

---

## 11. Bed photo guidelines

Show before upload:

```txt
For best AI preview:
- Keep the full bed visible.
- Take the photo from the foot side or a side angle.
- Use good lighting.
- Remove heavy blankets if possible.
- Avoid too many objects on the bed.
- Keep the camera steady.
- Make sure the bed is not heavily cropped.
```

Optional warning:

```txt
Photos with people, pets, or too much clutter may produce lower-quality previews.
```

---

## 12. Image preprocessing

Use `sharp` in Next.js API route or worker.

### Normalize input image

```ts
import sharp from 'sharp';
import crypto from 'crypto';

export async function normalizeUserImage(fileBuffer: Buffer) {
  const outputBuffer = await sharp(fileBuffer)
    .rotate()
    .resize({
      width: 1536,
      height: 1536,
      fit: 'inside',
      withoutEnlargement: true
    })
    .webp({ quality: 90 })
    .toBuffer();

  const hash = crypto
    .createHash('sha256')
    .update(outputBuffer)
    .digest('hex');

  return {
    buffer: outputBuffer,
    contentType: 'image/webp',
    hash
  };
}
```

### Why normalize

Normalization helps:

```txt
consistent provider input
reduced upload cost
faster processing
cache duplicate inputs
stripped metadata
better privacy
```

---

## 13. Prompt design

### Main prompt

```txt
Apply the selected bedsheet design realistically onto the visible bed or mattress in the target room photo.

Only replace the bedsheet/bed-covering fabric area.
Preserve the original room, walls, floor, headboard, pillows, cushions, objects, lighting, shadows, camera angle, and perspective.
Keep pillows and objects on top of the bed visible if present.
Preserve the bedsheet pattern, colors, scale, borders, and fabric texture from the product reference.
Make the result photorealistic and suitable for ecommerce preview.

Do not change the bed shape.
Do not change the room layout.
Do not add new furniture.
Do not remove pillows unless they are part of the replaced bedsheet area.
Do not alter walls, floor, curtains, or background.
```

### Negative prompt

```txt
blurry, distorted bed, changed room, changed walls, extra pillows, missing pillows, altered furniture, wrong pattern, wrong color, unrealistic folds, warped objects, duplicated objects, changed headboard, low quality, cartoon, illustration, CGI
```

### Provider-specific adaptation

Some providers support:

```txt
image prompt
text prompt
mask image
negative prompt
control image
strength
guidance scale
seed
webhook
```

Do not assume all providers support all options. The provider adapter must map your internal input to each provider’s required fields.

---

## 14. Optional masking strategy

### Phase 1 AI mode

Let provider infer bed region from prompt.

### Better version

Generate or collect a mask for the bed area.

Options:

```txt
1. User manually draws bed area.
2. User taps 4 corners and system creates polygon mask.
3. AI segmentation model detects bed/mattress.
4. Admin/product-specific mask not applicable because user rooms differ.
```

### Manual mask hybrid

You can combine Mode 1 and Mode 2:

```txt
User uploads room photo
User taps 4 bed corners
System creates mask
AI replaces only masked area
```

This improves AI reliability and reduces unwanted room changes.

Mask generation from 4 corners:

```ts
function createBedMask(width: number, height: number, points: Point[]) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = 'black';
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = 'white';
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  ctx.lineTo(points[1].x, points[1].y);
  ctx.lineTo(points[2].x, points[2].y);
  ctx.lineTo(points[3].x, points[3].y);
  ctx.closePath();
  ctx.fill();

  return canvas;
}
```

Use mask only if provider supports it.

---

## 15. Worker design

### Worker responsibilities

```txt
1. Read queue message.
2. Fetch job row.
3. Mark job processing.
4. Generate signed URLs for input and product assets.
5. Build provider prompt.
6. Call selected provider.
7. Download result image if provider returns URL.
8. Normalize result image.
9. Upload result to Supabase Storage.
10. Update job completed.
11. Log usage.
12. On failure, retry or mark failed.
```

### Worker pseudo-code

```ts
export async function processBedsheetPreviewJob(jobId: string) {
  const job = await getJob(jobId);

  if (!job || job.status !== 'queued') return;

  await markJobProcessing(jobId);

  try {
    const productAssets = await getBedsheetAIAssets(job.product_id);

    const inputSignedUrl = await createSignedUrl(job.input_storage_path, 60 * 15);
    const textureSignedUrl = await createSignedUrl(productAssets.texture_storage_path, 60 * 15);

    const prompt = buildBedsheetPrompt({
      productName: productAssets.product_name,
      customPrompt: productAssets.default_prompt
    });

    const provider = await getActiveBedsheetProvider();

    const result = await provider.generateBedsheetPreview({
      jobId,
      roomImageUrl: inputSignedUrl,
      bedsheetTextureUrl: textureSignedUrl,
      styledReferenceUrl: productAssets.styled_bed_reference_url,
      productName: productAssets.product_name,
      prompt,
      negativePrompt: productAssets.negative_prompt
    });

    const resultBuffer = result.imageBuffer
      ? result.imageBuffer
      : await downloadImageToBuffer(result.imageUrl!);

    const normalizedResult = await sharp(resultBuffer)
      .resize({
        width: 1536,
        height: 1536,
        fit: 'inside',
        withoutEnlargement: true
      })
      .webp({ quality: 92 })
      .toBuffer();

    const resultPath = `ar-results/${job.user_id ?? 'guest'}/${jobId}/result.webp`;

    await uploadToStorage({
      bucket: 'ar-results',
      path: resultPath,
      buffer: normalizedResult,
      contentType: 'image/webp'
    });

    await markJobCompleted(jobId, {
      resultStoragePath: resultPath,
      provider: provider.key,
      providerJobId: result.providerJobId,
      providerResponse: result.rawResponse
    });
  } catch (error) {
    await handleJobFailure(jobId, error);
  }
}
```

---

## 16. Queue options

### Option A: Supabase Queues

Best if you want to keep infrastructure simple.

Flow:

```txt
Insert queue message when job is created.
Worker polls queue.
Worker processes message.
Worker archives/deletes message on success.
```

Pros:

```txt
No Redis required
Postgres-native
Good fit with Supabase
Durable messages
```

Cons:

```txt
You still need a worker runtime
Not ideal for very high-throughput heavy jobs without planning
```

### Option B: BullMQ + Redis

Good if you already run Redis.

Pros:

```txt
Mature
Retries/backoff
Concurrency controls
Dashboard options
```

Cons:

```txt
Requires Redis
More infrastructure
```

### Option C: Supabase Edge Function background tasks

Good for lightweight async tasks.

For AI jobs, be careful with function time limits and provider latency. Prefer durable queue for long-running generation.

---

## 17. Job statuses

Use clear statuses:

```txt
pending    → row created but not queued
queued     → message pushed to queue
processing → worker started
completed  → result ready
failed     → failed after retries
cancelled  → user deleted/cancelled
expired    → cleanup policy expired the job
```

Frontend messages:

```ts
const statusMessages = {
  queued: 'Your preview is in queue...',
  processing: 'Generating your realistic preview...',
  completed: 'Preview ready',
  failed: 'We could not generate this preview.',
  cancelled: 'Preview cancelled',
  expired: 'Preview expired'
};
```

---

## 18. Retry strategy

### Retryable errors

```txt
provider timeout
provider temporary unavailable
network failure
rate limit
storage signed URL expired
```

### Non-retryable errors

```txt
invalid product asset
image format invalid
bed not visible
provider says unsafe image
user quota exceeded
```

### Backoff

```txt
Attempt 1: immediate
Attempt 2: after 15 seconds
Attempt 3: after 60 seconds
```

Recommended max attempts:

```txt
2 or 3
```

---

## 19. Caching

Avoid paying twice for identical previews.

Cache key:

```txt
user_id/session_id
+ product_id
+ input_image_hash
+ provider
+ prompt_version
+ texture_asset_id
```

Add columns:

```sql
alter table ar_preview_jobs
add column prompt_version text default 'bedsheet-v1',
add column cache_key text;
```

Create index:

```sql
create index ar_preview_jobs_cache_key_idx
on ar_preview_jobs(cache_key);
```

Before creating a new job:

```txt
Search completed job with same cache_key.
If found and result still exists:
  return existing job/result
```

---

## 20. Rate limits and cost control

### Suggested limits

```txt
Guest:
  1 AI preview per product/session
  3 AI previews per day/session

Logged-in user:
  3 AI previews/day
  10 AI previews/month

Customer with cart item:
  5 AI previews/day

Admin:
  unlimited
```

### Usage check query

```sql
select count(*)
from ar_usage_logs
where user_id = :user_id
and ar_type = 'bedsheet_ai_preview'
and action = 'created'
and created_at > now() - interval '1 day';
```

### IP/session limits

For guests, use:

```txt
session id cookie
hashed IP
user agent
```

Do not store raw IP if avoidable. Store hash.

---

## 21. Privacy and security

This mode handles bedroom photos, which are sensitive.

### Required rules

```txt
Use private buckets for user input and result.
Use signed URLs only.
Strip EXIF metadata.
Never expose provider API keys.
Do not use public URLs for user photos.
Allow delete.
Set expiry policy.
Mention privacy in UI.
```

### Privacy copy

```txt
Your photo is used only to generate this preview. It is not shown publicly. You can delete generated previews anytime.
```

### Provider privacy

Before choosing provider, check:

```txt
Do they store images?
Do they train on uploaded images?
Can you opt out of training?
Do they support data deletion?
Where is data processed?
What is the retention period?
Do they have commercial API terms?
```

---

## 22. Admin panel

### Admin AI asset manager

Path:

```txt
/admin/products/[id]/bedsheet-ai
```

Fields:

```txt
Enable AI preview
Texture image
Flat product image
Styled bed reference image
Default prompt
Negative prompt
Quality status
Provider override
Test preview button
```

### Admin test flow

```txt
1. Admin uploads sample room photo.
2. Admin runs AI preview.
3. Admin reviews result.
4. Admin marks product AI preview approved.
5. Public button appears on product page.
```

### Product readiness

Add product columns:

```sql
alter table products
add column bedsheet_ai_enabled boolean not null default false,
add column bedsheet_ai_status text not null default 'not_ready' check (
  bedsheet_ai_status in ('not_ready', 'testing', 'ready', 'disabled')
);
```

Show button only if:

```ts
product.bedsheet_ai_enabled === true &&
product.bedsheet_ai_status === 'ready'
```

---

## 23. Result UI

### Before/after viewer

Use:

```txt
left: uploaded room photo
right: AI generated preview
```

Recommended features:

```txt
drag slider
toggle before/after
download/share
try another photo
add to cart
delete preview
rating feedback
```

### Component

```tsx
export function BeforeAfterSlider({
  beforeUrl,
  afterUrl
}: {
  beforeUrl: string;
  afterUrl: string;
}) {
  // implement with two absolutely positioned images
  // slider range controls clip-path or width
}
```

### Feedback

Ask:

```txt
How accurate is this preview?
1–5 stars
Issue tags:
- wrong bed area
- wrong color
- pattern distorted
- changed room
- pillows changed
- low quality
```

Store in `ar_preview_feedback`.

---

## 24. Error handling

### Error code mapping

```ts
export const ERROR_MESSAGES: Record<string, string> = {
  BED_NOT_CLEAR: 'We could not clearly detect the bed. Please upload a photo with the full bed visible.',
  IMAGE_TOO_SMALL: 'Image is too small. Please upload a clearer photo.',
  IMAGE_TOO_LARGE: 'Image is too large. Please upload a smaller image.',
  LIMIT_REACHED: 'You have reached your AI preview limit for today.',
  PRODUCT_NOT_READY: 'AI preview is not available for this product yet.',
  PROVIDER_TIMEOUT: 'Preview generation took too long. Please try again.',
  PROVIDER_FAILED: 'We could not generate the preview right now.',
  UNSUPPORTED_IMAGE: 'This image format is not supported.'
};
```

### Logging

Log internal error details but show friendly messages.

Store:

```txt
error_code
error_message
provider_response
attempts
```

Do not store raw provider secrets or headers.

---

## 25. Observability

Track metrics:

```txt
jobs_created
jobs_completed
jobs_failed
average_generation_time
provider_error_rate
cost_per_completed_preview
completion_rate_by_product
add_to_cart_after_preview
feedback_rating_average
```

Analytics events:

```txt
bedsheet_ai_opened
photo_uploaded
job_created
job_queued
job_processing
job_completed
job_failed
preview_saved
preview_shared
add_to_cart_from_ai_preview
feedback_submitted
```

---

## 26. Webhook support

Some providers are async and send webhooks.

If provider supports webhooks:

```txt
1. Create job locally.
2. Call provider.
3. Store provider_job_id.
4. Mark job processing.
5. Provider calls your webhook when done.
6. Webhook verifies signature.
7. Webhook downloads result.
8. Upload result to Supabase.
9. Mark completed.
```

Webhook endpoint:

```http
POST /api/ar/bedsheet/provider-webhooks/:provider
```

Security:

```txt
Verify signature
Validate provider_job_id
Reject unknown jobs
Use idempotency
Do not trust raw payload blindly
```

---

## 27. Idempotency

Avoid duplicate job creation.

When creating job:

```txt
generate idempotency key on frontend
or compute cache key on backend
```

Request:

```json
{
  "productId": "uuid",
  "inputStoragePath": "...",
  "inputImageHash": "...",
  "idempotencyKey": "client-generated-key"
}
```

DB:

```sql
alter table ar_preview_jobs
add column idempotency_key text;

create unique index ar_preview_jobs_idempotency_idx
on ar_preview_jobs(user_id, idempotency_key)
where user_id is not null;
```

---

## 28. RLS policies

### General principles

```txt
Users can see only their own jobs.
Guests need session-token based handling through server APIs.
Do not allow direct public reads from private buckets.
Admin service role handles storage operations server-side.
```

### Jobs table example

```sql
alter table ar_preview_jobs enable row level security;

create policy "Users can read own preview jobs"
on ar_preview_jobs
for select
to authenticated
using (auth.uid() = user_id);
```

For inserts, preferably insert from server using service role after validating.

---

## 29. Cleanup jobs

Use scheduled cleanup.

### Delete expired guest jobs

```sql
update ar_preview_jobs
set status = 'expired'
where user_id is null
and status in ('completed', 'failed')
and created_at < now() - interval '7 days';
```

### Storage cleanup

A server cleanup task should:

```txt
1. Find expired jobs.
2. Delete input_storage_path.
3. Delete result_storage_path.
4. Mark status expired.
```

Do not rely only on DB cleanup, because storage objects must also be deleted.

---

## 30. Implementation task breakdown for coding agent

### Task 1: Database

- Create `bedsheet_ai_assets`.
- Create `ar_preview_jobs`.
- Create `ar_usage_logs`.
- Create `ar_provider_configs`.
- Create optional `ar_preview_feedback`.
- Add product AI status columns.
- Add indexes.
- Add RLS policies.

### Task 2: Storage

- Create `product-ar-assets`, `ar-user-inputs`, `ar-results`.
- Implement upload helper.
- Implement signed URL helper.
- Implement delete helper.
- Implement cleanup helper.

### Task 3: Admin AI assets

- Build admin upload page.
- Upload texture/flat/styled reference images.
- Normalize with Sharp.
- Save assets.
- Add prompt fields.
- Add test preview.
- Add approve/disable status.

### Task 4: User upload UI

- Build `BedPhotoUploader`.
- Show guidelines.
- Support file upload and camera capture.
- Preview selected image.
- Upload to API.
- Handle validation errors.

### Task 5: Job creation

- Build `/api/ar/bedsheet/preview-jobs`.
- Validate with Zod.
- Check limits.
- Check cache.
- Create job.
- Push queue.
- Return job id.

### Task 6: Worker

- Implement queue consumer.
- Fetch job.
- Mark processing.
- Build signed URLs.
- Build prompt.
- Call provider.
- Normalize result.
- Upload result.
- Mark completed/failed.
- Implement retries.

### Task 7: Provider abstraction

- Create base provider interface.
- Create mock provider.
- Create real provider adapter.
- Implement provider factory.
- Add env validation.
- Add timeout handling.
- Add retry handling.

### Task 8: Result UI

- Poll job status.
- Show progress state.
- Show before/after slider.
- Add download/share.
- Add feedback.
- Add delete preview.

### Task 9: Cost/privacy hardening

- Add usage limits.
- Add guest session id.
- Add image hashing/cache.
- Add private buckets and signed URLs.
- Add expiry cleanup.
- Add privacy notice.

### Task 10: QA

- Test multiple room photos.
- Test cluttered beds.
- Test low light.
- Test patterned old bedsheets.
- Test product patterns.
- Track provider success/failure.
- Tune prompts.

---

## 31. Acceptance criteria

Mode 2 is production-ready when:

```txt
1. Admin can upload AI-ready bedsheet assets.
2. Product page shows AI preview button only when ready.
3. User can upload or capture bed photo.
4. Image is validated, normalized, and stored privately.
5. Preview job is created asynchronously.
6. Frontend shows queued/processing/completed/failed states.
7. Worker calls provider and stores result.
8. User can view before/after result.
9. Usage limits prevent abuse.
10. Duplicate previews can be cached.
11. User can delete preview.
12. Guest previews expire.
13. Provider failures are logged and shown safely.
14. No provider API key is exposed to frontend.
```

---

## 32. Suggested rollout plan

### Internal alpha

```txt
Admin-only
10–20 products
50 test room photos
Compare providers
Tune prompts
```

### Private beta

```txt
Logged-in users only
Limit 1–3 previews/day
Collect feedback
Track add-to-cart rate
```

### Public launch

```txt
Enable on approved products
Guest limit enabled
Monitoring enabled
Cleanup enabled
Fallback to live Mode 1 if AI fails
```

---

## 33. Recommended combination with Mode 1

Best production UX:

```txt
Button 1: Live Preview
  instant and free

Button 2: Generate Realistic AI Preview
  slower but more realistic
```

If AI mode fails:

```txt
Show: "Try instant live preview instead"
```

If camera live mode fails:

```txt
Show: "Upload a photo for AI preview instead"
```

This gives users a fallback in both directions.

---

## 34. Reference documentation

Useful implementation references:

- Next.js Route Handlers: https://nextjs.org/docs/app/api-reference/file-conventions/route
- Supabase Storage: https://supabase.com/docs/guides/storage
- Supabase Storage uploads: https://supabase.com/docs/guides/storage/uploads/standard-uploads
- Supabase signed URLs: https://supabase.com/docs/guides/storage/buckets/fundamentals
- Supabase Queues: https://supabase.com/docs/guides/queues
- Supabase Edge Function background tasks: https://supabase.com/docs/guides/functions/background-tasks
- Supabase Edge Function limits: https://supabase.com/docs/guides/functions/limits

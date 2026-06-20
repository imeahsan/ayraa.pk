import { z } from 'zod';

export const RepeatModeSchema = z.enum(['repeat', 'cover', 'contain']);

export const ARSettingsSchema = z.object({
  opacity: z.number().min(0).max(1).default(0.85),
  scale: z.number().positive().default(1.0),
  rotation: z.number().default(0),
  repeatMode: RepeatModeSchema.default('repeat')
});

export const CornerPointSchema = z.object({
  x: z.number(),
  y: z.number(),
  label: z.enum(['topLeft', 'topRight', 'bottomRight', 'bottomLeft'])
});

export const CornerPointsSchema = z.array(CornerPointSchema).length(4);

export const AssetUploadSchema = z.object({
  productId: z.string().uuid(),
  defaultOpacity: z.preprocess((val) => Number(val), z.number().min(0).max(1)).default(0.85),
  defaultScale: z.preprocess((val) => Number(val), z.number().positive()).default(1.0),
  defaultRotation: z.preprocess((val) => Number(val), z.number()).default(0),
  repeatMode: RepeatModeSchema.default('repeat')
});

import { z } from "zod";

const captionOptional = z.string().trim().max(200).optional().nullable();

export const photoCreateSchema = z.object({
  storagePath: z.string().trim().min(1).max(500),
  captionPt: captionOptional,
  captionEn: captionOptional,
  isVisible: z.boolean().default(true),
});

export const photoUpdateSchema = photoCreateSchema.partial();

export const photoReorderSchema = z.object({
  ids: z.array(z.string().uuid()).min(1),
});

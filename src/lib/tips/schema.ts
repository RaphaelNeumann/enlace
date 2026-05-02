import { z } from "zod";

const text = (max: number) => z.string().trim().min(1).max(max);
const textOptional = (max: number) => z.string().trim().min(1).max(max).optional().nullable();
const httpsUrlOptional = z
  .string()
  .trim()
  .url()
  .startsWith("https://", { message: "must start with https://" })
  .max(500)
  .optional()
  .nullable();

export const TIP_ICON_WHITELIST = [
  "Hotel",
  "MapPin",
  "Utensils",
  "Plane",
  "Bus",
  "Music",
  "Heart",
  "Sparkles",
  "Info",
  "Camera",
  "Coffee",
  "Calendar",
] as const;
export type TipIcon = (typeof TIP_ICON_WHITELIST)[number];

export const tipCategoryCreateSchema = z.object({
  namePt: text(60),
  nameEn: textOptional(60),
  iconName: z.enum(TIP_ICON_WHITELIST).optional().nullable(),
  isVisible: z.boolean().default(true),
});

export const tipCategoryUpdateSchema = tipCategoryCreateSchema.partial();

export const tipCreateSchema = z.object({
  categoryId: z.string().uuid(),
  titlePt: text(120),
  titleEn: textOptional(120),
  bodyPt: z.string().trim().min(1).max(2000),
  bodyEn: z.string().trim().min(1).max(2000).optional().nullable(),
  externalUrl: httpsUrlOptional,
  isVisible: z.boolean().default(true),
});

export const tipUpdateSchema = tipCreateSchema.partial();

export const reorderSchema = z.object({
  ids: z.array(z.string().uuid()).min(1),
});

export type TipCategoryCreate = z.infer<typeof tipCategoryCreateSchema>;
export type TipCreate = z.infer<typeof tipCreateSchema>;

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

export const giftCreateSchema = z.object({
  titlePt: text(120),
  titleEn: textOptional(120),
  descriptionPt: z.string().trim().max(1000).default(""),
  descriptionEn: z.string().trim().max(1000).optional().nullable(),
  photoStoragePath: z.string().trim().max(500).optional().nullable(),
  externalUrl: httpsUrlOptional,
  suggestedAmountCents: z.number().int().nonnegative().max(100_000_000).optional().nullable(),
  allowAmountOverride: z.boolean().default(true),
  isVisible: z.boolean().default(true),
});

export const giftUpdateSchema = giftCreateSchema.partial();

export const giftReorderSchema = z.object({
  ids: z.array(z.string().uuid()).min(1),
});

export const giftMessageCreateSchema = z.object({
  giftId: z.string().uuid().optional().nullable(),
  senderName: text(80),
  message: text(500),
});

export type GiftCreate = z.infer<typeof giftCreateSchema>;
export type GiftUpdate = z.infer<typeof giftUpdateSchema>;
export type GiftMessageCreate = z.infer<typeof giftMessageCreateSchema>;

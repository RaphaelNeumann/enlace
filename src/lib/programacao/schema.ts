import { z } from "zod";

const text = (max: number, fallback = "") => z.string().trim().max(max).default(fallback);
const textOptional = (max: number) => z.string().trim().max(max).optional().nullable();
const httpsUrlOptional = z
  .string()
  .trim()
  .url()
  .startsWith("https://", { message: "must start with https://" })
  .max(500)
  .optional()
  .nullable();

export const programacaoCardIdSchema = z.enum(["ceremony", "reception"]);

export const programacaoCardUpdateSchema = z.object({
  titlePt: text(120),
  titleEn: textOptional(120),
  date: z.coerce.date().nullable().optional(),
  time: text(20),
  addressPt: text(300),
  addressEn: textOptional(300),
  mapsUrl: httpsUrlOptional,
  iconKey: text(60),
  iconImageStoragePath: textOptional(500),
  isVisible: z.boolean().default(true),
});

export type ProgramacaoCardId = z.infer<typeof programacaoCardIdSchema>;
export type ProgramacaoCardUpdate = z.infer<typeof programacaoCardUpdateSchema>;

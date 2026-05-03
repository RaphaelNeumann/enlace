import { z } from "zod";

const text = (max: number, fallback = "") => z.string().trim().max(max).default(fallback);
const textOptional = (max: number) => z.string().trim().max(max).optional().nullable();

export const dressCodeUpdateSchema = z.object({
  headlinePt: text(120),
  headlineEn: textOptional(120),
  introPt: text(800),
  introEn: textOptional(800),
  womenTitlePt: text(60, "Mulheres"),
  womenTitleEn: textOptional(60),
  womenBodyPt: text(2000),
  womenBodyEn: textOptional(2000),
  menTitlePt: text(60, "Homens"),
  menTitleEn: textOptional(60),
  menBodyPt: text(2000),
  menBodyEn: textOptional(2000),
  iconKey: text(60),
  womenIconImageStoragePath: textOptional(500),
  menIconImageStoragePath: textOptional(500),
});

export type DressCodeUpdate = z.infer<typeof dressCodeUpdateSchema>;

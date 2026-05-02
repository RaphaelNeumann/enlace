import { z } from "zod";

const text = (max: number) => z.string().trim().min(1).max(max);
const textOptional = (max: number) => z.string().trim().min(1).max(max).optional().nullable();

export const faqCreateSchema = z.object({
  questionPt: text(200),
  questionEn: textOptional(200),
  answerPt: text(2000),
  answerEn: textOptional(2000),
  isVisible: z.boolean().default(true),
});

export const faqUpdateSchema = faqCreateSchema.partial();

export const faqReorderSchema = z.object({
  ids: z.array(z.string().uuid()).min(1),
});

export type FaqCreate = z.infer<typeof faqCreateSchema>;
export type FaqUpdate = z.infer<typeof faqUpdateSchema>;

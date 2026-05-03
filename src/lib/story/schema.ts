import { z } from "zod";

const text = (max: number, fallback = "") => z.string().trim().max(max).default(fallback);
const textOptional = (max: number) => z.string().trim().max(max).optional().nullable();
const storagePathOptional = z.string().trim().max(500).optional().nullable();

export const storyUpdateSchema = z.object({
  bodyPt: text(20000),
  bodyEn: textOptional(20000),
  photo1StoragePath: storagePathOptional,
  photo2StoragePath: storagePathOptional,
  photo3StoragePath: storagePathOptional,
});

export type StoryUpdate = z.infer<typeof storyUpdateSchema>;

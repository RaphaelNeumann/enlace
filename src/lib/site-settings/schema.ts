import { z } from "zod";

export const partnersOrderSchema = z.enum(["p1-p2", "p2-p1"]);

const text = (max = 200) => z.string().trim().max(max);
const textOptional = (max = 200) => text(max).optional().nullable();

export const siteSettingsUpdateSchema = z.object({
  partner1Name: text(120).default(""),
  partner1ShortName: text(60).default(""),
  partner2Name: text(120).default(""),
  partner2ShortName: text(60).default(""),
  partnersOrder: partnersOrderSchema.default("p1-p2"),
  monogramInitialsOverride: textOptional(8),
  weddingDate: z.coerce.date().nullable().optional(),
  weddingTimeZone: text(64).default("America/Sao_Paulo"),
  venueShortName: text(120).default(""),
  venueAddressForMaps: textOptional(500),
  siteTitlePt: text(160).default(""),
  siteTitleEn: textOptional(160),
  metaDescriptionPt: text(320).default(""),
  metaDescriptionEn: textOptional(320),
  ogImageStoragePath: textOptional(500),
  heroIllustrationStoragePath: textOptional(500),
  photoGalleryAsSubpage: z.boolean().default(false),
  showHero: z.boolean().default(true),
  showCeremonyReception: z.boolean().default(true),
  showDressCode: z.boolean().default(true),
  showStory: z.boolean().default(true),
  showGifts: z.boolean().default(true),
  showTips: z.boolean().default(true),
  showFaq: z.boolean().default(true),
  showPhotoGallery: z.boolean().default(true),
});

export type SiteSettingsUpdate = z.infer<typeof siteSettingsUpdateSchema>;

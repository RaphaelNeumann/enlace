"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { CONTENT_TAGS } from "@/lib/content-tags";
import { auth } from "@/lib/auth";
import { adminUpdateSiteSettings } from "@/lib/site-settings/admin-update";

export async function updateSiteSettingsAction(formData: FormData): Promise<void> {
  const session = await auth();
  const input = formDataToInput(formData);
  await adminUpdateSiteSettings(input, session);
  revalidatePath("/", "layout");
  revalidateTag(CONTENT_TAGS.siteSettings, "max");
  revalidatePath("/admin/site");
}

// Fields that the schema treats as nullable; an empty string in the form
// should be persisted as null for these.
const NULLABLE_FIELDS = new Set([
  "monogramInitialsOverride",
  "monogramImageStoragePath",
  "weddingDate",
  "venueAddressForMaps",
  "siteTitleEn",
  "metaDescriptionEn",
  "ogImageStoragePath",
  "heroIllustrationStoragePath",
]);

const VISIBILITY_FLAGS = [
  "showHero",
  "showCeremonyReception",
  "showDressCode",
  "showStory",
  "showGifts",
  "showTips",
  "showFaq",
  "showPhotoGallery",
  "photoGalleryAsSubpage",
] as const;

function formDataToInput(formData: FormData): Record<string, unknown> {
  const obj: Record<string, unknown> = {};
  for (const [key, value] of formData.entries()) {
    if (typeof value !== "string") continue;
    if (value === "on") {
      obj[key] = true;
    } else if (value === "" && NULLABLE_FIELDS.has(key)) {
      obj[key] = null;
    } else {
      obj[key] = value;
    }
  }
  // Visibility flags absent from the form mean "off" (unchecked) — set to false.
  for (const flag of VISIBILITY_FLAGS) {
    obj[flag] = obj[flag] === true;
  }
  return obj;
}

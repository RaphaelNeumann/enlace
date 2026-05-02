"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { adminUpdateSiteSettings } from "@/lib/site-settings/admin-update";

export async function updateSiteSettingsAction(formData: FormData): Promise<void> {
  const session = await auth();
  const input = formDataToInput(formData);
  await adminUpdateSiteSettings(input, session);
  revalidatePath("/", "layout");
  revalidatePath("/admin/site");
}

function formDataToInput(formData: FormData): Record<string, unknown> {
  const obj: Record<string, unknown> = {};
  for (const [key, value] of formData.entries()) {
    if (typeof value === "string") {
      // Booleans come as "on" or absent (HTML form convention).
      if (value === "on") {
        obj[key] = true;
      } else if (value === "") {
        obj[key] = null;
      } else {
        obj[key] = value;
      }
    }
  }
  // Visibility flags absent from the form mean "off" (unchecked) — set to false.
  for (const flag of [
    "showHero",
    "showCeremonyReception",
    "showDressCode",
    "showStory",
    "showGifts",
    "showTips",
    "showFaq",
    "showPhotoGallery",
    "photoGalleryAsSubpage",
  ]) {
    obj[flag] = obj[flag] === true;
  }
  return obj;
}

import { describe, expect, it } from "vitest";

// formDataToInput is private to actions.ts; we re-implement the same shape
// here to verify the conversion semantics used by the Server Action.
// Why duplicate? actions.ts uses "use server" + next/cache imports that aren't
// trivial to import in vitest; we exercise the conversion via FormData.
// TODO: when Next.js Server Action testing matures, replace with a true
// integration test against the real action.

import { siteSettingsUpdateSchema } from "@/lib/site-settings/schema";

function formDataToInput(formData: FormData): Record<string, unknown> {
  const obj: Record<string, unknown> = {};
  for (const [key, value] of formData.entries()) {
    if (typeof value === "string") {
      if (value === "on") obj[key] = true;
      else if (value === "") obj[key] = null;
      else obj[key] = value;
    }
  }
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

describe("/admin/site form-data conversion", () => {
  it("maps text fields, checked booleans, and absent flags", () => {
    const fd = new FormData();
    fd.set("partner1Name", "Fernanda");
    fd.set("venueShortName", "Olympus");
    fd.set("showHero", "on");
    // showCeremonyReception is absent → should default to false in the action
    const out = formDataToInput(fd);
    expect(out.partner1Name).toBe("Fernanda");
    expect(out.venueShortName).toBe("Olympus");
    expect(out.showHero).toBe(true);
    expect(out.showCeremonyReception).toBe(false);
    expect(out.showStory).toBe(false);
  });

  it("converts empty-string fields to null (so EN fallback works)", () => {
    const fd = new FormData();
    fd.set("siteTitleEn", "");
    const out = formDataToInput(fd);
    expect(out.siteTitleEn).toBeNull();
  });

  it("output passes the Zod schema with sensible defaults", () => {
    const fd = new FormData();
    fd.set("partner1Name", "Ana");
    fd.set("partner2Name", "Bia");
    fd.set("siteTitlePt", "Casamento Ana e Bia");
    fd.set("metaDescriptionPt", "Site oficial");
    const parsed = siteSettingsUpdateSchema.parse(formDataToInput(fd));
    expect(parsed.partner1Name).toBe("Ana");
    expect(parsed.partnersOrder).toBe("p1-p2"); // schema default
    expect(parsed.weddingTimeZone).toBe("America/Sao_Paulo"); // schema default
  });
});

import { describe, expect, it } from "vitest";

// formDataToInput is private to actions.ts; we re-implement the same shape
// here to verify the conversion semantics used by the Server Action.
// Why duplicate? actions.ts uses "use server" + next/cache imports that aren't
// trivial to import in vitest; we exercise the conversion via FormData.

import { siteSettingsUpdateSchema } from "@/lib/site-settings/schema";

const NULLABLE_FIELDS = new Set([
  "monogramInitialsOverride",
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
  for (const flag of VISIBILITY_FLAGS) {
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
    const out = formDataToInput(fd);
    expect(out.partner1Name).toBe("Fernanda");
    expect(out.venueShortName).toBe("Olympus");
    expect(out.showHero).toBe(true);
    expect(out.showCeremonyReception).toBe(false);
    expect(out.showStory).toBe(false);
  });

  it("converts empty strings on nullable fields to null", () => {
    const fd = new FormData();
    fd.set("siteTitleEn", "");
    fd.set("metaDescriptionEn", "");
    fd.set("monogramInitialsOverride", "");
    const out = formDataToInput(fd);
    expect(out.siteTitleEn).toBeNull();
    expect(out.metaDescriptionEn).toBeNull();
    expect(out.monogramInitialsOverride).toBeNull();
  });

  it("keeps empty strings on required fields as empty strings (not null)", () => {
    // This is the regression: formDataToInput used to coerce all empty
    // strings to null, which made required text fields fail Zod validation
    // ("expected string, received null"). Required fields now stay strings.
    const fd = new FormData();
    fd.set("partner1Name", "");
    fd.set("partner1ShortName", "");
    fd.set("partner2Name", "");
    fd.set("siteTitlePt", "");
    fd.set("metaDescriptionPt", "");
    fd.set("venueShortName", "");
    const out = formDataToInput(fd);
    expect(out.partner1Name).toBe("");
    expect(out.partner1ShortName).toBe("");
    expect(out.partner2Name).toBe("");
    expect(out.siteTitlePt).toBe("");
    expect(out.metaDescriptionPt).toBe("");
    expect(out.venueShortName).toBe("");
  });

  it("output for an entirely-empty form still passes the Zod schema", () => {
    // The default-state form (skeleton DB, blank inputs) shouldn't trip
    // validation just because the couple hasn't filled anything in yet.
    const fd = new FormData();
    fd.set("partner1Name", "");
    fd.set("partner1ShortName", "");
    fd.set("partner2Name", "");
    fd.set("partner2ShortName", "");
    fd.set("partnersOrder", "p1-p2");
    fd.set("monogramInitialsOverride", "");
    fd.set("weddingTimeZone", "America/Sao_Paulo");
    fd.set("venueShortName", "");
    fd.set("venueAddressForMaps", "");
    fd.set("siteTitlePt", "");
    fd.set("siteTitleEn", "");
    fd.set("metaDescriptionPt", "");
    fd.set("metaDescriptionEn", "");
    expect(() => siteSettingsUpdateSchema.parse(formDataToInput(fd))).not.toThrow();
  });

  it("output passes the Zod schema with populated fields", () => {
    const fd = new FormData();
    fd.set("partner1Name", "Ana");
    fd.set("partner2Name", "Bia");
    fd.set("siteTitlePt", "Casamento Ana e Bia");
    fd.set("metaDescriptionPt", "Site oficial");
    const parsed = siteSettingsUpdateSchema.parse(formDataToInput(fd));
    expect(parsed.partner1Name).toBe("Ana");
    expect(parsed.partnersOrder).toBe("p1-p2");
    expect(parsed.weddingTimeZone).toBe("America/Sao_Paulo");
  });
});

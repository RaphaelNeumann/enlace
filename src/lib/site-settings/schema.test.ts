import { describe, expect, it } from "vitest";
import { siteSettingsUpdateSchema } from "./schema";

describe("siteSettingsUpdateSchema", () => {
  it("accepts an empty object and fills defaults", () => {
    const out = siteSettingsUpdateSchema.parse({});
    expect(out.partner1Name).toBe("");
    expect(out.partnersOrder).toBe("p1-p2");
    expect(out.weddingTimeZone).toBe("America/Sao_Paulo");
    expect(out.showHero).toBe(true);
    expect(out.showCeremonyReception).toBe(true);
    expect(out.photoGalleryAsSubpage).toBe(false);
  });

  it("trims whitespace around text fields", () => {
    const out = siteSettingsUpdateSchema.parse({
      partner1Name: "  Fernanda  ",
      venueShortName: "  Local X  ",
    });
    expect(out.partner1Name).toBe("Fernanda");
    expect(out.venueShortName).toBe("Local X");
  });

  it("rejects partnersOrder outside the enum", () => {
    expect(() =>
      siteSettingsUpdateSchema.parse({ partnersOrder: "p3-p4" }),
    ).toThrow();
  });

  it("coerces ISO date strings to Date", () => {
    const out = siteSettingsUpdateSchema.parse({
      weddingDate: "2026-10-20T19:00:00Z",
    });
    expect(out.weddingDate).toBeInstanceOf(Date);
  });

  it("accepts null and undefined for optional fields", () => {
    const out = siteSettingsUpdateSchema.parse({
      siteTitleEn: null,
      ogImageStoragePath: null,
      weddingDate: null,
      monogramInitialsOverride: null,
      monogramImageStoragePath: null,
    });
    expect(out.siteTitleEn).toBeNull();
    expect(out.ogImageStoragePath).toBeNull();
    expect(out.weddingDate).toBeNull();
    expect(out.monogramImageStoragePath).toBeNull();
  });

  it("accepts a Supabase storage path for monogramImageStoragePath", () => {
    const out = siteSettingsUpdateSchema.parse({
      monogramImageStoragePath: "monograms/fd.png",
    });
    expect(out.monogramImageStoragePath).toBe("monograms/fd.png");
  });

  it("rejects strings exceeding the configured cap", () => {
    expect(() =>
      siteSettingsUpdateSchema.parse({
        partner1Name: "x".repeat(121),
      }),
    ).toThrow();
  });

  it("rejects non-boolean for visibility flags", () => {
    expect(() =>
      siteSettingsUpdateSchema.parse({ showHero: "yes" as unknown as boolean }),
    ).toThrow();
  });
});

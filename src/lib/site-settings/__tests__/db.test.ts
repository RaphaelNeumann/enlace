import { describe, expect, it, beforeEach } from "vitest";
import { db } from "@/lib/db";
import { siteSettings } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getSiteSettings } from "../get";
import { updateSiteSettingsInDb, getSiteSettingsRow } from "../update";

const SINGLETON_ID = "default";

async function resetSingleton() {
  await db.delete(siteSettings).where(eq(siteSettings.id, SINGLETON_ID));
}

describe("siteSettings DB layer", () => {
  beforeEach(async () => {
    await resetSingleton();
  });

  it("getSiteSettings creates the singleton row when none exists", async () => {
    const before = await getSiteSettingsRow();
    expect(before).toBeNull();
    const settings = await getSiteSettings();
    expect(settings.id).toBe(SINGLETON_ID);
    expect(settings.partner1Name).toBe("");
    expect(settings.weddingTimeZone).toBe("America/Sao_Paulo");
    expect(settings.showHero).toBe(true);
  });

  it("getSiteSettings returns the existing row on subsequent reads", async () => {
    const first = await getSiteSettings();
    const second = await getSiteSettings();
    expect(second.id).toBe(first.id);
    expect(second.partner1Name).toBe(first.partner1Name);
  });

  it("updateSiteSettingsInDb upserts and returns the persisted row", async () => {
    const updated = await updateSiteSettingsInDb({
      partner1Name: "Fernanda",
      partner1ShortName: "F",
      partner2Name: "Daniel",
      partner2ShortName: "D",
      partnersOrder: "p1-p2",
      venueShortName: "Buffet Olympus",
      siteTitlePt: "Casamento Fernanda & Daniel",
      metaDescriptionPt: "Site oficial",
      showHero: true,
      showCeremonyReception: true,
      showDressCode: true,
      showStory: true,
      showGifts: true,
      showTips: true,
      showFaq: true,
      showPhotoGallery: true,
    });
    expect(updated.partner1Name).toBe("Fernanda");
    expect(updated.partner2Name).toBe("Daniel");
    expect(updated.venueShortName).toBe("Buffet Olympus");
    expect(updated.updatedAt).toBeInstanceOf(Date);
    const reread = await getSiteSettings();
    expect(reread.partner1Name).toBe("Fernanda");
  });

  it("updateSiteSettingsInDb is idempotent on the singleton row", async () => {
    await updateSiteSettingsInDb({ partner1Name: "Fernanda" });
    await updateSiteSettingsInDb({ partner1Name: "Fernanda 2" });
    const all = await db.select().from(siteSettings);
    expect(all).toHaveLength(1);
    expect(all[0].partner1Name).toBe("Fernanda 2");
  });

  it("updateSiteSettingsInDb rejects invalid input", async () => {
    await expect(
      updateSiteSettingsInDb({ partnersOrder: "p9-p9" }),
    ).rejects.toThrow();
  });

  it("updateSiteSettingsInDb refuses a row that violates the singleton CHECK", async () => {
    // Try inserting a non-singleton row directly — should fail at DB level
    await expect(
      db.insert(siteSettings).values({ id: "other", partner1Name: "X" }),
    ).rejects.toThrow();
  });
});

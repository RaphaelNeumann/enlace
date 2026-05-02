import { describe, expect, it, beforeEach } from "vitest";
import { db } from "@/lib/db";
import { siteSettings } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { adminUpdateSiteSettings } from "../admin-update";
import { AuthorizationError } from "@/lib/server-auth/assert-role";

async function reset() {
  await db.delete(siteSettings).where(eq(siteSettings.id, "default"));
}

describe("adminUpdateSiteSettings", () => {
  beforeEach(async () => {
    await reset();
  });

  it("persists when the session has role COUPLE", async () => {
    const result = await adminUpdateSiteSettings(
      { partner1Name: "Fernanda", partner2Name: "Daniel" },
      { user: { role: "COUPLE" } },
    );
    expect(result.partner1Name).toBe("Fernanda");
    expect(result.partner2Name).toBe("Daniel");
  });

  it("persists when the session has role CEREMONIAL", async () => {
    const result = await adminUpdateSiteSettings(
      { venueShortName: "Buffet X" },
      { user: { role: "CEREMONIAL" } },
    );
    expect(result.venueShortName).toBe("Buffet X");
  });

  it("rejects with AuthorizationError when no session", async () => {
    await expect(
      adminUpdateSiteSettings({ partner1Name: "X" }, null),
    ).rejects.toBeInstanceOf(AuthorizationError);
  });

  it("rejects with AuthorizationError when role is missing", async () => {
    await expect(
      adminUpdateSiteSettings({ partner1Name: "X" }, { user: {} }),
    ).rejects.toBeInstanceOf(AuthorizationError);
  });

  it("rejects with AuthorizationError on a non-admin role", async () => {
    await expect(
      adminUpdateSiteSettings(
        { partner1Name: "X" },
        { user: { role: "GUEST" } },
      ),
    ).rejects.toBeInstanceOf(AuthorizationError);
  });

  it("does not write to the DB on auth failure", async () => {
    await expect(
      adminUpdateSiteSettings({ partner1Name: "Stolen" }, null),
    ).rejects.toThrow();
    const rows = await db.select().from(siteSettings);
    expect(rows.length).toBe(0);
  });

  it("propagates Zod errors after auth passes", async () => {
    await expect(
      adminUpdateSiteSettings(
        { partnersOrder: "p9-p9" },
        { user: { role: "COUPLE" } },
      ),
    ).rejects.toThrow();
  });
});

import { describe, expect, it, beforeEach } from "vitest";
import { db } from "@/lib/db";
import { dressCode } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getDressCode, updateDressCodeInDb, adminUpdateDressCode } from "../db";
import { dressCodeUpdateSchema } from "../schema";
import { AuthorizationError } from "@/lib/server-auth/assert-role";

beforeEach(async () => {
  await db.delete(dressCode).where(eq(dressCode.id, "default"));
});

describe("dressCodeUpdateSchema", () => {
  it("accepts an empty object and fills defaults", () => {
    const out = dressCodeUpdateSchema.parse({});
    expect(out.womenTitlePt).toBe("Mulheres");
    expect(out.menTitlePt).toBe("Homens");
    expect(out.headlinePt).toBe("");
  });

  it("trims whitespace", () => {
    const out = dressCodeUpdateSchema.parse({ headlinePt: "  Social  " });
    expect(out.headlinePt).toBe("Social");
  });

  it("rejects oversize text", () => {
    expect(() =>
      dressCodeUpdateSchema.parse({ womenBodyPt: "x".repeat(2001) }),
    ).toThrow();
  });
});

describe("dress-code DB", () => {
  it("getDressCode lazily creates the singleton", async () => {
    const settings = await getDressCode();
    expect(settings.id).toBe("default");
    expect(settings.womenTitlePt).toBe("Mulheres");
    expect(settings.menTitlePt).toBe("Homens");
  });

  it("updateDressCodeInDb upserts and returns the persisted row", async () => {
    const out = await updateDressCodeInDb({
      headlinePt: "SOCIAL OU ESPORTE FINO",
      womenBodyPt: "Vestidos midi ou longos.",
      menBodyPt: "Calça social, camisa.",
    });
    expect(out.headlinePt).toBe("SOCIAL OU ESPORTE FINO");
    expect(out.womenBodyPt).toBe("Vestidos midi ou longos.");
    expect(out.menBodyPt).toBe("Calça social, camisa.");
  });

  it("updateDressCodeInDb is idempotent on the singleton", async () => {
    await updateDressCodeInDb({ headlinePt: "A" });
    await updateDressCodeInDb({ headlinePt: "B" });
    const all = await db.select().from(dressCode);
    expect(all).toHaveLength(1);
    expect(all[0].headlinePt).toBe("B");
  });

  it("adminUpdateDressCode throws on missing session", async () => {
    await expect(
      adminUpdateDressCode({ headlinePt: "X" }, null),
    ).rejects.toBeInstanceOf(AuthorizationError);
  });

  it("adminUpdateDressCode persists with COUPLE session", async () => {
    const out = await adminUpdateDressCode(
      { headlinePt: "X" },
      { user: { role: "COUPLE" } },
    );
    expect(out.headlinePt).toBe("X");
  });
});

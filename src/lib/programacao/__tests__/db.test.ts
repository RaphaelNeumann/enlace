import { describe, expect, it, beforeEach } from "vitest";
import { db } from "@/lib/db";
import { programacaoCards } from "@/lib/db/schema";
import {
  listProgramacao,
  getProgramacaoCard,
  updateProgramacaoCardInDb,
  adminUpdateProgramacaoCard,
  ensureProgramacaoSeeded,
} from "../db";
import { programacaoCardUpdateSchema } from "../schema";
import { AuthorizationError } from "@/lib/server-auth/assert-role";

beforeEach(async () => {
  await db.delete(programacaoCards);
});

describe("programacaoCardUpdateSchema", () => {
  it("trims and applies defaults", () => {
    const out = programacaoCardUpdateSchema.parse({});
    expect(out.titlePt).toBe("");
    expect(out.time).toBe("");
  });

  it("rejects non-https maps URL", () => {
    expect(() =>
      programacaoCardUpdateSchema.parse({ mapsUrl: "http://example.com" }),
    ).toThrow();
  });

  it("accepts a valid https maps URL", () => {
    const out = programacaoCardUpdateSchema.parse({
      mapsUrl: "https://maps.google.com/?q=foo",
    });
    expect(out.mapsUrl).toBe("https://maps.google.com/?q=foo");
  });
});

describe("programacao DB", () => {
  it("ensureProgramacaoSeeded creates both fixed rows on first call", async () => {
    await ensureProgramacaoSeeded();
    const all = await db.select().from(programacaoCards);
    expect(all.map((r) => r.id).sort()).toEqual(["ceremony", "reception"]);
  });

  it("listProgramacao returns both rows seeded", async () => {
    const rows = await listProgramacao();
    expect(rows).toHaveLength(2);
  });

  it("getProgramacaoCard returns the requested row", async () => {
    const row = await getProgramacaoCard("ceremony");
    expect(row.id).toBe("ceremony");
  });

  it("getProgramacaoCard rejects an invalid id", async () => {
    await expect(getProgramacaoCard("bogus")).rejects.toThrow();
  });

  it("updateProgramacaoCardInDb mutates only the requested card", async () => {
    await listProgramacao();
    const updated = await updateProgramacaoCardInDb("ceremony", {
      titlePt: "Cerimônia",
      time: "16h",
      addressPt: "Endereço X",
      mapsUrl: "https://maps.google.com/?q=x",
      iconKey: "rings",
    });
    expect(updated.id).toBe("ceremony");
    expect(updated.titlePt).toBe("Cerimônia");
    const reception = await getProgramacaoCard("reception");
    expect(reception.titlePt).toBe("");
  });

  it("adminUpdateProgramacaoCard throws on missing session", async () => {
    await expect(
      adminUpdateProgramacaoCard("ceremony", { titlePt: "X" }, null),
    ).rejects.toBeInstanceOf(AuthorizationError);
  });

  it("adminUpdateProgramacaoCard persists with COUPLE session", async () => {
    const updated = await adminUpdateProgramacaoCard(
      "reception",
      { titlePt: "Recepção" },
      { user: { role: "COUPLE" } },
    );
    expect(updated.titlePt).toBe("Recepção");
  });
});

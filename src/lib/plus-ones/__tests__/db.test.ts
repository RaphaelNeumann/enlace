import { describe, expect, it, beforeEach } from "vitest";
import { db } from "@/lib/db";
import { guests, plusOnes } from "@/lib/db/schema";
import {
  listPlusOnesForGuest,
  replacePlusOnesForGuest,
  PlusOneCapExceeded,
  GuestNotFound,
  adminReplacePlusOnesForGuest,
} from "../db";
import { plusOneNamesSchema } from "../schema";
import { AuthorizationError } from "@/lib/server-auth/assert-role";

beforeEach(async () => {
  await db.delete(plusOnes);
  await db.delete(guests);
});

async function makeGuest(plusOnesAllowed = 0) {
  const row = await db
    .insert(guests)
    .values({ firstName: "A", lastName: "B", plusOnesAllowed })
    .returning();
  return row[0];
}

describe("plusOneNamesSchema", () => {
  it("rejects empty names in the array", () => {
    expect(() => plusOneNamesSchema.parse([""])).toThrow();
  });
  it("rejects names beyond 80 chars", () => {
    expect(() => plusOneNamesSchema.parse(["x".repeat(81)])).toThrow();
  });
  it("trims names", () => {
    const out = plusOneNamesSchema.parse(["  Maria  "]);
    expect(out[0]).toBe("Maria");
  });
});

describe("plus-ones DB", () => {
  it("listPlusOnesForGuest returns empty for new guest", async () => {
    const g = await makeGuest();
    expect(await listPlusOnesForGuest(g.id)).toEqual([]);
  });

  it("replacePlusOnesForGuest inserts ordered rows", async () => {
    const g = await makeGuest(2);
    const out = await replacePlusOnesForGuest(g.id, ["Maria", "João"]);
    expect(out).toHaveLength(2);
    expect(out[0].name).toBe("Maria");
    expect(out[0].position).toBe(0);
    expect(out[1].position).toBe(1);
  });

  it("replacePlusOnesForGuest is atomic on subsequent replaces", async () => {
    const g = await makeGuest(3);
    await replacePlusOnesForGuest(g.id, ["A", "B"]);
    await replacePlusOnesForGuest(g.id, ["C"]);
    const final = await listPlusOnesForGuest(g.id);
    expect(final.map((p) => p.name)).toEqual(["C"]);
  });

  it("replacePlusOnesForGuest accepts an empty array", async () => {
    const g = await makeGuest(2);
    await replacePlusOnesForGuest(g.id, ["A"]);
    const cleared = await replacePlusOnesForGuest(g.id, []);
    expect(cleared).toEqual([]);
    expect(await listPlusOnesForGuest(g.id)).toEqual([]);
  });

  it("throws PlusOneCapExceeded when names.length > plusOnesAllowed", async () => {
    const g = await makeGuest(1);
    await expect(replacePlusOnesForGuest(g.id, ["A", "B"])).rejects.toBeInstanceOf(
      PlusOneCapExceeded,
    );
  });

  it("throws GuestNotFound for unknown guestId", async () => {
    await expect(
      replacePlusOnesForGuest("00000000-0000-0000-0000-000000000000", ["A"]),
    ).rejects.toBeInstanceOf(GuestNotFound);
  });

  it("adminReplacePlusOnesForGuest rejects without admin session", async () => {
    const g = await makeGuest(1);
    await expect(
      adminReplacePlusOnesForGuest(g.id, ["A"], null),
    ).rejects.toBeInstanceOf(AuthorizationError);
  });

  it("adminReplacePlusOnesForGuest persists with COUPLE session", async () => {
    const g = await makeGuest(1);
    const out = await adminReplacePlusOnesForGuest(
      g.id,
      ["A"],
      { user: { role: "COUPLE" } },
    );
    expect(out[0].name).toBe("A");
  });
});

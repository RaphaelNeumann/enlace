import { describe, expect, it, beforeEach } from "vitest";
import { db } from "@/lib/db";
import { guests, plusOnes } from "@/lib/db/schema";
import {
  listGuests,
  getGuest,
  findGuestByFullName,
  searchGuestsForTypeahead,
  createGuestInDb,
  updateGuestInDb,
  deleteGuestInDb,
  setRsvpStatusInDb,
  listConfirmedWithPlusOnes,
  listGuestsWithObservations,
  adminCreateGuest,
} from "../db";
import { guestCreateSchema, guestUpdateSchema } from "../schema";
import { AuthorizationError } from "@/lib/server-auth/assert-role";

beforeEach(async () => {
  await db.delete(plusOnes);
  await db.delete(guests);
});

describe("guest schemas", () => {
  it("rejects empty firstName / lastName on create", () => {
    expect(() => guestCreateSchema.parse({ firstName: "", lastName: "" })).toThrow();
  });
  it("trims and defaults", () => {
    const out = guestCreateSchema.parse({ firstName: "  Ana  ", lastName: " Souza " });
    expect(out.firstName).toBe("Ana");
    expect(out.lastName).toBe("Souza");
    expect(out.plusOnesAllowed).toBe(0);
    expect(out.source).toBe("admin");
  });
  it("rejects negative plusOnesAllowed", () => {
    expect(() =>
      guestCreateSchema.parse({ firstName: "A", lastName: "B", plusOnesAllowed: -1 }),
    ).toThrow();
  });
  it("guestUpdateSchema accepts partial input", () => {
    expect(guestUpdateSchema.parse({ firstName: "X" }).firstName).toBe("X");
    expect(guestUpdateSchema.parse({}).firstName).toBeUndefined();
  });
});

describe("guests CRUD", () => {
  it("listGuests returns empty initially", async () => {
    expect(await listGuests()).toEqual([]);
  });

  it("createGuestInDb inserts and getGuest retrieves", async () => {
    const created = await createGuestInDb({ firstName: "Ana", lastName: "Souza" });
    expect(created.firstName).toBe("Ana");
    const fetched = await getGuest(created.id);
    expect(fetched?.id).toBe(created.id);
    expect(fetched?.rsvpStatus).toBe("pending");
    expect(fetched?.source).toBe("admin");
  });

  it("listGuests sorts alphabetically by full name", async () => {
    await createGuestInDb({ firstName: "Bia", lastName: "Z" });
    await createGuestInDb({ firstName: "Ana", lastName: "Z" });
    const list = await listGuests();
    expect(list.map((g) => g.firstName)).toEqual(["Ana", "Bia"]);
  });

  it("listGuests filters by search across both names", async () => {
    await createGuestInDb({ firstName: "Ana", lastName: "Silva" });
    await createGuestInDb({ firstName: "Bia", lastName: "Souza" });
    expect((await listGuests({ search: "souza" })).map((g) => g.firstName)).toEqual([
      "Bia",
    ]);
  });

  it("listGuests filters by status and source", async () => {
    const a = await createGuestInDb({ firstName: "Ana", lastName: "Z" });
    await createGuestInDb({ firstName: "Bia", lastName: "Z", source: "submitted" });
    await setRsvpStatusInDb(a.id, "confirmed");
    expect((await listGuests({ status: "confirmed" })).length).toBe(1);
    expect((await listGuests({ source: "submitted" })).length).toBe(1);
  });

  it("findGuestByFullName matches case-insensitively and trims", async () => {
    await createGuestInDb({ firstName: "Ana", lastName: "Silva" });
    expect(await findGuestByFullName("ana", "silva")).not.toBeNull();
    expect(await findGuestByFullName(" ANA ", " SILVA ")).not.toBeNull();
    expect(await findGuestByFullName("ana", "outro")).toBeNull();
  });

  it("findGuestByFullName returns null on empty inputs", async () => {
    expect(await findGuestByFullName("", "")).toBeNull();
  });

  it("searchGuestsForTypeahead returns ≤10 prefix matches", async () => {
    for (let i = 0; i < 12; i++) {
      await createGuestInDb({ firstName: `Ana${i}`, lastName: "Z" });
    }
    const matches = await searchGuestsForTypeahead({ prefix: "Ana" });
    expect(matches.length).toBe(10);
  });

  it("searchGuestsForTypeahead matches lastName + 'firstName lastName'", async () => {
    await createGuestInDb({ firstName: "Ana", lastName: "Souza" });
    expect((await searchGuestsForTypeahead({ prefix: "souz" })).length).toBe(1);
    expect((await searchGuestsForTypeahead({ prefix: "ana s" })).length).toBe(1);
  });

  it("searchGuestsForTypeahead requires at least 2 chars", async () => {
    await expect(
      searchGuestsForTypeahead({ prefix: "a" }),
    ).rejects.toThrow();
  });

  it("updateGuestInDb patches fields and bumps updatedAt", async () => {
    const created = await createGuestInDb({ firstName: "Ana", lastName: "Z" });
    const updated = await updateGuestInDb(created.id, { plusOnesAllowed: 2 });
    expect(updated?.plusOnesAllowed).toBe(2);
    expect(updated!.updatedAt.getTime()).toBeGreaterThanOrEqual(
      created.updatedAt.getTime(),
    );
  });

  it("updateGuestInDb returns null for unknown id", async () => {
    expect(await updateGuestInDb("00000000-0000-0000-0000-000000000000", { firstName: "X" })).toBeNull();
  });

  it("deleteGuestInDb cascades to plus_ones", async () => {
    const created = await createGuestInDb({ firstName: "A", lastName: "B" });
    await db.insert(plusOnes).values({ guestId: created.id, name: "Acomp" });
    expect(await deleteGuestInDb(created.id)).toBe(true);
    expect((await db.select().from(plusOnes)).length).toBe(0);
  });

  it("deleteGuestInDb returns false for unknown id", async () => {
    expect(await deleteGuestInDb("00000000-0000-0000-0000-000000000000")).toBe(false);
  });
});

describe("setRsvpStatusInDb", () => {
  it("confirmed sets rsvpSubmittedAt to now", async () => {
    const created = await createGuestInDb({ firstName: "A", lastName: "B" });
    const out = await setRsvpStatusInDb(created.id, "confirmed");
    expect(out?.rsvpStatus).toBe("confirmed");
    expect(out?.rsvpSubmittedAt).toBeInstanceOf(Date);
  });

  it("pending clears rsvpSubmittedAt", async () => {
    const created = await createGuestInDb({ firstName: "A", lastName: "B" });
    await setRsvpStatusInDb(created.id, "confirmed");
    const reverted = await setRsvpStatusInDb(created.id, "pending");
    expect(reverted?.rsvpStatus).toBe("pending");
    expect(reverted?.rsvpSubmittedAt).toBeNull();
  });

  it("declined preserves rsvpSubmittedAt unchanged", async () => {
    const created = await createGuestInDb({ firstName: "A", lastName: "B" });
    const confirmed = await setRsvpStatusInDb(created.id, "confirmed");
    const original = confirmed!.rsvpSubmittedAt!;
    const declined = await setRsvpStatusInDb(created.id, "declined");
    expect(declined?.rsvpStatus).toBe("declined");
    expect(declined?.rsvpSubmittedAt?.getTime()).toBe(original.getTime());
  });

  it("rejects an invalid status value", async () => {
    const created = await createGuestInDb({ firstName: "A", lastName: "B" });
    await expect(setRsvpStatusInDb(created.id, "weird")).rejects.toThrow();
  });

  it("returns null for unknown id", async () => {
    expect(await setRsvpStatusInDb("00000000-0000-0000-0000-000000000000", "confirmed")).toBeNull();
  });
});

describe("listConfirmedWithPlusOnes", () => {
  it("returns confirmed guests with their plus-ones inline", async () => {
    const a = await createGuestInDb({ firstName: "A", lastName: "B" });
    const c = await createGuestInDb({ firstName: "C", lastName: "D" });
    await setRsvpStatusInDb(a.id, "confirmed");
    await setRsvpStatusInDb(c.id, "declined");
    await db.insert(plusOnes).values([
      { guestId: a.id, name: "Acomp 1", position: 0 },
      { guestId: a.id, name: "Acomp 2", position: 1 },
    ]);
    const list = await listConfirmedWithPlusOnes();
    expect(list).toHaveLength(1);
    expect(list[0].plusOnes.map((p) => p.name)).toEqual(["Acomp 1", "Acomp 2"]);
  });

  it("returns empty when nobody has confirmed", async () => {
    await createGuestInDb({ firstName: "A", lastName: "B" });
    expect(await listConfirmedWithPlusOnes()).toEqual([]);
  });
});

describe("listGuestsWithObservations", () => {
  it("returns guests whose observation is non-empty", async () => {
    const a = await createGuestInDb({ firstName: "A", lastName: "B" });
    const c = await createGuestInDb({ firstName: "C", lastName: "D" });
    await updateGuestInDb(a.id, { observation: "Allergic to nuts" });
    await updateGuestInDb(c.id, { observation: "  " });
    const obs = await listGuestsWithObservations();
    expect(obs).toHaveLength(1);
    expect(obs[0].observation).toContain("nuts");
  });

  it("filters by search term against name and observation", async () => {
    const a = await createGuestInDb({ firstName: "Ana", lastName: "Z" });
    const b = await createGuestInDb({ firstName: "Bia", lastName: "Z" });
    await updateGuestInDb(a.id, { observation: "alergia a frutos do mar" });
    await updateGuestInDb(b.id, { observation: "vou chegar atrasada" });
    const matches = await listGuestsWithObservations({ search: "alergia" });
    expect(matches).toHaveLength(1);
    expect(matches[0].id).toBe(a.id);
  });
});

describe("admin gates", () => {
  it("adminCreateGuest rejects without admin session", async () => {
    await expect(
      adminCreateGuest({ firstName: "A", lastName: "B" }, null),
    ).rejects.toBeInstanceOf(AuthorizationError);
  });
});

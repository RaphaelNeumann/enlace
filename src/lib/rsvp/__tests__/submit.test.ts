import { describe, expect, it, beforeEach } from "vitest";
import { db } from "@/lib/db";
import { guests, plusOnes } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { submitRsvp } from "../submit";
import { createGuestInDb } from "@/lib/guests/db";

beforeEach(async () => {
  await db.delete(plusOnes);
  await db.delete(guests);
});

describe("submitRsvp — closed mode", () => {
  it("confirms a pending guest with plus-ones and observation", async () => {
    await createGuestInDb({ firstName: "Ana", lastName: "Souza", plusOnesAllowed: 2 });
    const result = await submitRsvp(
      {
        firstName: "Ana",
        lastName: "Souza",
        attending: "yes",
        plusOneNames: ["Maria", "João"],
        observation: "alergia a frutos do mar",
      },
      { mode: "closed" },
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.status).toBe("confirmed");
      expect(result.guest.rsvpStatus).toBe("confirmed");
      expect(result.guest.observation).toBe("alergia a frutos do mar");
      const list = await db.select().from(plusOnes).where(eq(plusOnes.guestId, result.guest.id));
      expect(list.map((p) => p.name)).toEqual(["Maria", "João"]);
    }
  });

  it("declines a pending guest without inserting plus-ones", async () => {
    await createGuestInDb({ firstName: "Ana", lastName: "Souza", plusOnesAllowed: 2 });
    const result = await submitRsvp(
      {
        firstName: "Ana",
        lastName: "Souza",
        attending: "no",
        plusOneNames: ["Should be ignored"],
      },
      { mode: "closed" },
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.status).toBe("declined");
      expect(result.guest.rsvpStatus).toBe("declined");
    }
    const list = await db.select().from(plusOnes);
    expect(list).toEqual([]);
  });

  it("returns guestNotInList when the name does not match", async () => {
    const result = await submitRsvp(
      { firstName: "Ana", lastName: "Souza", attending: "yes" },
      { mode: "closed" },
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.kind).toBe("guestNotInList");
  });

  it("returns alreadySubmitted when the guest already confirmed", async () => {
    const created = await createGuestInDb({ firstName: "Ana", lastName: "Souza", plusOnesAllowed: 0 });
    await submitRsvp(
      { firstName: "Ana", lastName: "Souza", attending: "yes" },
      { mode: "closed" },
    );
    const second = await submitRsvp(
      { firstName: "Ana", lastName: "Souza", attending: "no" },
      { mode: "closed" },
    );
    expect(second.ok).toBe(false);
    if (!second.ok && second.error.kind === "alreadySubmitted") {
      expect(second.error.status).toBe("confirmed");
    }
    expect((await db.select().from(guests).where(eq(guests.id, created.id)))[0].rsvpStatus).toBe("confirmed");
  });

  it("returns plusOnesExceedAllowance when too many companions", async () => {
    await createGuestInDb({ firstName: "Ana", lastName: "Souza", plusOnesAllowed: 1 });
    const result = await submitRsvp(
      {
        firstName: "Ana",
        lastName: "Souza",
        attending: "yes",
        plusOneNames: ["A", "B", "C"],
      },
      { mode: "closed" },
    );
    expect(result.ok).toBe(false);
    if (!result.ok && result.error.kind === "plusOnesExceedAllowance") {
      expect(result.error.allowed).toBe(1);
      expect(result.error.attempted).toBe(3);
    }
  });

  it("rejects empty firstName via validation", async () => {
    const result = await submitRsvp(
      { firstName: "", lastName: "X", attending: "yes" },
      { mode: "closed" },
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.kind).toBe("validation");
  });
});

describe("submitRsvp — open mode", () => {
  it("creates a new guest with source=submitted on first submission", async () => {
    const result = await submitRsvp(
      {
        firstName: "Self",
        lastName: "Registered",
        attending: "yes",
        observation: "vou levar uma garrafa",
      },
      { mode: "open", openModeMaxPlusOnes: 0 },
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.guest.source).toBe("submitted");
      expect(result.guest.rsvpStatus).toBe("confirmed");
    }
  });

  it("rejects a duplicate name as duplicateOpenSubmission", async () => {
    await submitRsvp(
      { firstName: "Self", lastName: "X", attending: "yes" },
      { mode: "open", openModeMaxPlusOnes: 0 },
    );
    const second = await submitRsvp(
      { firstName: "Self", lastName: "X", attending: "no" },
      { mode: "open", openModeMaxPlusOnes: 0 },
    );
    expect(second.ok).toBe(false);
    if (!second.ok) expect(second.error.kind).toBe("duplicateOpenSubmission");
  });

  it("respects the global plus-ones cap on a brand-new submission", async () => {
    const result = await submitRsvp(
      {
        firstName: "Self",
        lastName: "X",
        attending: "yes",
        plusOneNames: ["A", "B"],
      },
      { mode: "open", openModeMaxPlusOnes: 1 },
    );
    expect(result.ok).toBe(false);
    if (!result.ok && result.error.kind === "plusOnesExceedAllowance") {
      expect(result.error.allowed).toBe(1);
    }
  });

  it("inserts plus-ones for a confirmed open-mode submission", async () => {
    const result = await submitRsvp(
      {
        firstName: "Self",
        lastName: "X",
        attending: "yes",
        plusOneNames: ["A"],
      },
      { mode: "open", openModeMaxPlusOnes: 1 },
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      const list = await db
        .select()
        .from(plusOnes)
        .where(eq(plusOnes.guestId, result.guest.id));
      expect(list.map((p) => p.name)).toEqual(["A"]);
    }
  });
});

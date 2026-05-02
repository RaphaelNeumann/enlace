import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { guests, plusOnes } from "@/lib/db/schema";
import { findGuestByFullName } from "@/lib/guests/db";
import { rsvpSubmitSchema } from "./schema";
import type { Guest } from "@/lib/guests/db";

export type RsvpMode = "closed" | "open";

export interface SubmitOptions {
  mode: RsvpMode;
  openModeMaxPlusOnes?: number;
}

export type SubmitResult =
  | { ok: true; guest: Guest; status: "confirmed" | "declined" }
  | { ok: false; error: SubmitError };

export type SubmitError =
  | { kind: "validation"; details: unknown }
  | { kind: "guestNotInList" }
  | { kind: "alreadySubmitted"; status: "confirmed" | "declined" }
  | { kind: "plusOnesExceedAllowance"; allowed: number; attempted: number }
  | { kind: "duplicateOpenSubmission" };

export async function submitRsvp(
  rawInput: unknown,
  options: SubmitOptions,
  client: typeof db = db,
): Promise<SubmitResult> {
  const parseResult = rsvpSubmitSchema.safeParse(rawInput);
  if (!parseResult.success) {
    return { ok: false, error: { kind: "validation", details: parseResult.error.format() } };
  }
  const input = parseResult.data;
  const status: "confirmed" | "declined" =
    input.attending === "yes" ? "confirmed" : "declined";

  const existing = await findGuestByFullName(input.firstName, input.lastName, client);

  if (options.mode === "closed") {
    if (!existing) {
      return { ok: false, error: { kind: "guestNotInList" } };
    }
    if (existing.rsvpStatus !== "pending") {
      return {
        ok: false,
        error: {
          kind: "alreadySubmitted",
          status: existing.rsvpStatus as "confirmed" | "declined",
        },
      };
    }
    return runTransaction({
      client,
      guest: existing,
      status,
      plusOneNames: status === "confirmed" ? input.plusOneNames : [],
      observation: input.observation ?? null,
    });
  }

  // open mode
  if (existing) {
    if (existing.rsvpStatus !== "pending") {
      return {
        ok: false,
        error: { kind: "duplicateOpenSubmission" },
      };
    }
    return runTransaction({
      client,
      guest: existing,
      status,
      plusOneNames: status === "confirmed" ? input.plusOneNames : [],
      observation: input.observation ?? null,
    });
  }

  // open mode, new guest — create row with the global cap
  const cap = options.openModeMaxPlusOnes ?? 0;
  if (input.plusOneNames.length > cap) {
    return {
      ok: false,
      error: {
        kind: "plusOnesExceedAllowance",
        allowed: cap,
        attempted: input.plusOneNames.length,
      },
    };
  }
  const created = await client
    .insert(guests)
    .values({
      firstName: input.firstName,
      lastName: input.lastName,
      plusOnesAllowed: cap,
      source: "submitted",
      rsvpStatus: status,
      rsvpSubmittedAt: status === "confirmed" ? new Date() : null,
      observation: input.observation ?? null,
    })
    .returning();
  const newGuest = created[0];
  if (status === "confirmed" && input.plusOneNames.length > 0) {
    await client.insert(plusOnes).values(
      input.plusOneNames.map((name, position) => ({
        guestId: newGuest.id,
        name,
        position,
      })),
    );
  }
  return { ok: true, guest: newGuest, status };
}

async function runTransaction(args: {
  client: typeof db;
  guest: Guest;
  status: "confirmed" | "declined";
  plusOneNames: string[];
  observation: string | null;
}): Promise<SubmitResult> {
  const { client, guest, status, plusOneNames, observation } = args;
  if (status === "confirmed" && plusOneNames.length > guest.plusOnesAllowed) {
    return {
      ok: false,
      error: {
        kind: "plusOnesExceedAllowance",
        allowed: guest.plusOnesAllowed,
        attempted: plusOneNames.length,
      },
    };
  }
  const updatedGuest = await client.transaction(async (tx) => {
    const updated = await tx
      .update(guests)
      .set({
        rsvpStatus: status,
        rsvpSubmittedAt: status === "confirmed" ? new Date() : guest.rsvpSubmittedAt,
        observation,
        updatedAt: new Date(),
      })
      .where(eq(guests.id, guest.id))
      .returning();
    await tx.delete(plusOnes).where(eq(plusOnes.guestId, guest.id));
    if (status === "confirmed" && plusOneNames.length > 0) {
      await tx.insert(plusOnes).values(
        plusOneNames.map((name, position) => ({
          guestId: guest.id,
          name,
          position,
        })),
      );
    }
    return updated[0];
  });
  return { ok: true, guest: updatedGuest, status };
}

import { asc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { plusOnes, guests } from "@/lib/db/schema";
import { withAdmin } from "@/lib/server-auth/with-admin";
import { plusOneNamesSchema } from "./schema";

export type PlusOne = typeof plusOnes.$inferSelect;

export async function listPlusOnesForGuest(
  guestId: string,
  client: typeof db = db,
): Promise<PlusOne[]> {
  return client
    .select()
    .from(plusOnes)
    .where(eq(plusOnes.guestId, guestId))
    .orderBy(asc(plusOnes.position));
}

export class PlusOneCapExceeded extends Error {
  constructor(allowed: number, attempted: number) {
    super(`Plus-one cap exceeded (allowed=${allowed}, attempted=${attempted})`);
    this.name = "PlusOneCapExceeded";
  }
}

export class GuestNotFound extends Error {
  constructor(id: string) {
    super(`Guest not found: ${id}`);
    this.name = "GuestNotFound";
  }
}

/**
 * Atomically replaces the plus-one rows for a guest. Validates the input
 * array against the guest's `plusOnesAllowed`; refuses if exceeded.
 */
export async function replacePlusOnesForGuest(
  guestId: string,
  rawNames: unknown,
): Promise<PlusOne[]> {
  const names = plusOneNamesSchema.parse(rawNames);
  const guestRow = await db
    .select({ plusOnesAllowed: guests.plusOnesAllowed })
    .from(guests)
    .where(eq(guests.id, guestId))
    .limit(1);
  if (guestRow.length === 0) {
    throw new GuestNotFound(guestId);
  }
  if (names.length > guestRow[0].plusOnesAllowed) {
    throw new PlusOneCapExceeded(guestRow[0].plusOnesAllowed, names.length);
  }
  return db.transaction(async (tx) => {
    await tx.delete(plusOnes).where(eq(plusOnes.guestId, guestId));
    if (names.length === 0) return [];
    const inserted = await tx
      .insert(plusOnes)
      .values(
        names.map((name, position) => ({ guestId, name, position })),
      )
      .returning();
    return inserted;
  });
}

export const adminReplacePlusOnesForGuest = withAdmin(replacePlusOnesForGuest);

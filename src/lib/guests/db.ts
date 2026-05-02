import { and, asc, desc, eq, ilike, or, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { guests, plusOnes } from "@/lib/db/schema";
import { withAdmin } from "@/lib/server-auth/with-admin";
import {
  guestCreateSchema,
  guestUpdateSchema,
  typeaheadInputSchema,
  rsvpStatusSchema,
} from "./schema";

export type Guest = typeof guests.$inferSelect;

export interface ListGuestsOptions {
  search?: string | null;
  status?: "pending" | "confirmed" | "declined" | null;
  source?: "admin" | "submitted" | null;
}

export async function listGuests(
  options: ListGuestsOptions = {},
  client: typeof db = db,
): Promise<Guest[]> {
  const filters = [] as ReturnType<typeof eq>[];
  if (options.search) {
    const like = `%${options.search.trim().toLowerCase()}%`;
    filters.push(
      or(
        ilike(guests.firstName, like),
        ilike(guests.lastName, like),
      )!,
    );
  }
  if (options.status) {
    filters.push(eq(guests.rsvpStatus, options.status));
  }
  if (options.source) {
    filters.push(eq(guests.source, options.source));
  }
  const where = filters.length > 0 ? and(...filters) : undefined;
  const query = client
    .select()
    .from(guests)
    .orderBy(asc(guests.firstName), asc(guests.lastName));
  return where ? query.where(where) : query;
}

export async function getGuest(
  id: string,
  client: typeof db = db,
): Promise<Guest | null> {
  const rows = await client.select().from(guests).where(eq(guests.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function findGuestByFullName(
  firstName: string,
  lastName: string,
  client: typeof db = db,
): Promise<Guest | null> {
  const f = firstName.trim().toLowerCase();
  const l = lastName.trim().toLowerCase();
  if (!f || !l) return null;
  const rows = await client
    .select()
    .from(guests)
    .where(
      and(
        sql`lower(${guests.firstName}) = ${f}`,
        sql`lower(${guests.lastName}) = ${l}`,
      ),
    )
    .limit(1);
  return rows[0] ?? null;
}

export async function searchGuestsForTypeahead(
  input: unknown,
  client: typeof db = db,
): Promise<Pick<Guest, "id" | "firstName" | "lastName" | "plusOnesAllowed">[]> {
  const { prefix } = typeaheadInputSchema.parse(input);
  const like = `${prefix.toLowerCase()}%`;
  const rows = await client
    .select({
      id: guests.id,
      firstName: guests.firstName,
      lastName: guests.lastName,
      plusOnesAllowed: guests.plusOnesAllowed,
    })
    .from(guests)
    .where(
      or(
        sql`lower(${guests.firstName}) like ${like}`,
        sql`lower(${guests.lastName}) like ${like}`,
        sql`lower(${guests.firstName} || ' ' || ${guests.lastName}) like ${like}`,
      ),
    )
    .orderBy(asc(guests.firstName), asc(guests.lastName))
    .limit(10);
  return rows;
}

export async function createGuestInDb(
  input: unknown,
  client: typeof db = db,
): Promise<Guest> {
  const parsed = guestCreateSchema.parse(input);
  const inserted = await client.insert(guests).values(parsed).returning();
  return inserted[0];
}

export async function updateGuestInDb(
  id: string,
  input: unknown,
  client: typeof db = db,
): Promise<Guest | null> {
  const parsed = guestUpdateSchema.parse(input);
  if (Object.keys(parsed).length === 0) return getGuest(id, client);
  const updated = await client
    .update(guests)
    .set({ ...parsed, updatedAt: new Date() })
    .where(eq(guests.id, id))
    .returning();
  return updated[0] ?? null;
}

export async function deleteGuestInDb(
  id: string,
  client: typeof db = db,
): Promise<boolean> {
  const deleted = await client
    .delete(guests)
    .where(eq(guests.id, id))
    .returning({ id: guests.id });
  return deleted.length > 0;
}

/**
 * Apply an RSVP-status transition. Mirrors the matrix in
 * docs/features/admin-rsvp-actions.md:
 * - any → confirmed: rsvpSubmittedAt = now()
 * - confirmed → pending (cancel): rsvpSubmittedAt = null
 * - * → declined: rsvpSubmittedAt unchanged (historic record)
 */
export async function setRsvpStatusInDb(
  id: string,
  rawStatus: unknown,
  client: typeof db = db,
): Promise<Guest | null> {
  const status = rsvpStatusSchema.parse(rawStatus);
  const existing = await getGuest(id, client);
  if (!existing) return null;
  let nextSubmittedAt = existing.rsvpSubmittedAt;
  if (status === "confirmed") {
    nextSubmittedAt = new Date();
  } else if (status === "pending") {
    nextSubmittedAt = null;
  }
  const updated = await client
    .update(guests)
    .set({
      rsvpStatus: status,
      rsvpSubmittedAt: nextSubmittedAt,
      updatedAt: new Date(),
    })
    .where(eq(guests.id, id))
    .returning();
  return updated[0] ?? null;
}

export async function listConfirmedWithPlusOnes(
  options: { search?: string | null; source?: "admin" | "submitted" | null } = {},
  client: typeof db = db,
): Promise<Array<Guest & { plusOnes: { id: string; name: string }[] }>> {
  const baseFilters = [eq(guests.rsvpStatus, "confirmed")] as ReturnType<typeof eq>[];
  if (options.search) {
    const like = `%${options.search.trim().toLowerCase()}%`;
    baseFilters.push(
      or(
        ilike(guests.firstName, like),
        ilike(guests.lastName, like),
      )!,
    );
  }
  if (options.source) {
    baseFilters.push(eq(guests.source, options.source));
  }
  const guestRows = await client
    .select()
    .from(guests)
    .where(and(...baseFilters))
    .orderBy(asc(guests.firstName), asc(guests.lastName));
  const ids = guestRows.map((g) => g.id);
  if (ids.length === 0) return [];
  const plusRows = await client
    .select({ id: plusOnes.id, name: plusOnes.name, guestId: plusOnes.guestId })
    .from(plusOnes)
    .where(or(...ids.map((id) => eq(plusOnes.guestId, id)))!)
    .orderBy(asc(plusOnes.position));
  const byGuest = new Map<string, { id: string; name: string }[]>();
  for (const r of plusRows) {
    const list = byGuest.get(r.guestId) ?? [];
    list.push({ id: r.id, name: r.name });
    byGuest.set(r.guestId, list);
  }
  return guestRows.map((g) => ({ ...g, plusOnes: byGuest.get(g.id) ?? [] }));
}

export async function listGuestsWithObservations(
  options: { search?: string | null } = {},
  client: typeof db = db,
): Promise<Guest[]> {
  const filters = [
    sql`${guests.observation} is not null`,
    sql`length(trim(${guests.observation})) > 0`,
  ] as unknown as ReturnType<typeof eq>[];
  if (options.search) {
    const like = `%${options.search.trim().toLowerCase()}%`;
    filters.push(
      or(
        ilike(guests.firstName, like),
        ilike(guests.lastName, like),
        ilike(guests.observation, like),
      )!,
    );
  }
  return client
    .select()
    .from(guests)
    .where(and(...filters))
    .orderBy(desc(guests.rsvpSubmittedAt));
}

export const adminCreateGuest = withAdmin(createGuestInDb);
export const adminUpdateGuest = withAdmin(updateGuestInDb);
export const adminDeleteGuest = withAdmin(deleteGuestInDb);
export const adminSetRsvpStatus = withAdmin(setRsvpStatusInDb);

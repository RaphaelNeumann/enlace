import { asc, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { faqEntries } from "@/lib/db/schema";
import { withAdmin } from "@/lib/server-auth/with-admin";
import {
  faqCreateSchema,
  faqUpdateSchema,
  faqReorderSchema,
} from "./schema";

export type FaqEntry = typeof faqEntries.$inferSelect;

export async function listFaq(
  options: { onlyVisible?: boolean } = {},
  client: typeof db = db,
): Promise<FaqEntry[]> {
  const query = client.select().from(faqEntries).orderBy(asc(faqEntries.position), asc(faqEntries.createdAt));
  const rows = await query;
  return options.onlyVisible ? rows.filter((r) => r.isVisible) : rows;
}

export async function createFaqInDb(input: unknown, client: typeof db = db): Promise<FaqEntry> {
  const parsed = faqCreateSchema.parse(input);
  const [{ next }] = await client
    .select({ next: sql<number>`coalesce(max(${faqEntries.position}), -1) + 1` })
    .from(faqEntries);
  const inserted = await client
    .insert(faqEntries)
    .values({ ...parsed, position: next })
    .returning();
  return inserted[0];
}

export async function updateFaqInDb(
  id: string,
  input: unknown,
  client: typeof db = db,
): Promise<FaqEntry | null> {
  const parsed = faqUpdateSchema.parse(input);
  if (Object.keys(parsed).length === 0) {
    const rows = await client.select().from(faqEntries).where(eq(faqEntries.id, id)).limit(1);
    return rows[0] ?? null;
  }
  const updated = await client
    .update(faqEntries)
    .set({ ...parsed, updatedAt: new Date() })
    .where(eq(faqEntries.id, id))
    .returning();
  return updated[0] ?? null;
}

export async function deleteFaqInDb(id: string, client: typeof db = db): Promise<boolean> {
  const deleted = await client.delete(faqEntries).where(eq(faqEntries.id, id)).returning({ id: faqEntries.id });
  return deleted.length > 0;
}

export async function reorderFaqInDb(input: unknown, client: typeof db = db): Promise<FaqEntry[]> {
  const parsed = faqReorderSchema.parse(input);
  await client.transaction(async (tx) => {
    for (let i = 0; i < parsed.ids.length; i++) {
      await tx
        .update(faqEntries)
        .set({ position: i, updatedAt: new Date() })
        .where(eq(faqEntries.id, parsed.ids[i]));
    }
  });
  return listFaq({}, client);
}

export const adminCreateFaq = withAdmin(createFaqInDb);
export const adminUpdateFaq = withAdmin(updateFaqInDb);
export const adminDeleteFaq = withAdmin(deleteFaqInDb);
export const adminReorderFaq = withAdmin(reorderFaqInDb);

import { asc, desc, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { gifts, giftMessages } from "@/lib/db/schema";
import { withAdmin } from "@/lib/server-auth/with-admin";
import {
  giftCreateSchema,
  giftUpdateSchema,
  giftReorderSchema,
  giftMessageCreateSchema,
} from "./schema";

export type Gift = typeof gifts.$inferSelect;
export type GiftMessage = typeof giftMessages.$inferSelect;

export async function listGifts(
  options: { onlyVisible?: boolean } = {},
  client: typeof db = db,
): Promise<Gift[]> {
  const rows = await client
    .select()
    .from(gifts)
    .orderBy(asc(gifts.position), asc(gifts.createdAt));
  return options.onlyVisible ? rows.filter((g) => g.isVisible) : rows;
}

export async function getGift(id: string, client: typeof db = db): Promise<Gift | null> {
  const rows = await client.select().from(gifts).where(eq(gifts.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function createGiftInDb(input: unknown): Promise<Gift> {
  const parsed = giftCreateSchema.parse(input);
  const [{ next }] = await db
    .select({ next: sql<number>`coalesce(max(${gifts.position}), -1) + 1` })
    .from(gifts);
  const inserted = await db
    .insert(gifts)
    .values({ ...parsed, position: next })
    .returning();
  return inserted[0];
}

export async function updateGiftInDb(
  id: string,
  input: unknown,
): Promise<Gift | null> {
  const parsed = giftUpdateSchema.parse(input);
  if (Object.keys(parsed).length === 0) return getGift(id);
  const updated = await db
    .update(gifts)
    .set({ ...parsed, updatedAt: new Date() })
    .where(eq(gifts.id, id))
    .returning();
  return updated[0] ?? null;
}

export async function deleteGiftInDb(id: string): Promise<boolean> {
  const deleted = await db.delete(gifts).where(eq(gifts.id, id)).returning({ id: gifts.id });
  return deleted.length > 0;
}

export async function reorderGiftsInDb(input: unknown): Promise<Gift[]> {
  const parsed = giftReorderSchema.parse(input);
  await db.transaction(async (tx) => {
    for (let i = 0; i < parsed.ids.length; i++) {
      await tx
        .update(gifts)
        .set({ position: i, updatedAt: new Date() })
        .where(eq(gifts.id, parsed.ids[i]));
    }
  });
  return listGifts({});
}

// Public: anyone (rate-limited at the route layer) can leave a message.
export async function createGiftMessageInDb(
  input: unknown,
  client: typeof db = db,
): Promise<GiftMessage> {
  const parsed = giftMessageCreateSchema.parse(input);
  const inserted = await client
    .insert(giftMessages)
    .values({
      giftId: parsed.giftId ?? null,
      senderName: parsed.senderName,
      message: parsed.message,
    })
    .returning();
  return inserted[0];
}

export async function listGiftMessages(client: typeof db = db): Promise<GiftMessage[]> {
  return client.select().from(giftMessages).orderBy(desc(giftMessages.createdAt));
}

export const adminCreateGift = withAdmin(createGiftInDb);
export const adminUpdateGift = withAdmin(updateGiftInDb);
export const adminDeleteGift = withAdmin(deleteGiftInDb);
export const adminReorderGifts = withAdmin(reorderGiftsInDb);

import { asc, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { tipCategories, tips } from "@/lib/db/schema";
import { withAdmin } from "@/lib/server-auth/with-admin";
import {
  tipCategoryCreateSchema,
  tipCategoryUpdateSchema,
  tipCreateSchema,
  tipUpdateSchema,
  reorderSchema,
} from "./schema";

export type TipCategory = typeof tipCategories.$inferSelect;
export type Tip = typeof tips.$inferSelect;

export async function listCategories(client: typeof db = db): Promise<TipCategory[]> {
  return client
    .select()
    .from(tipCategories)
    .orderBy(asc(tipCategories.position), asc(tipCategories.createdAt));
}

export async function listTipsByCategory(
  categoryId: string,
  client: typeof db = db,
): Promise<Tip[]> {
  return client
    .select()
    .from(tips)
    .where(eq(tips.categoryId, categoryId))
    .orderBy(asc(tips.position), asc(tips.createdAt));
}

export async function listVisibleCategoriesWithTips(
  client: typeof db = db,
): Promise<Array<TipCategory & { tips: Tip[] }>> {
  const cats = (await listCategories(client)).filter((c) => c.isVisible);
  if (cats.length === 0) return [];
  const allTips = await client
    .select()
    .from(tips)
    .orderBy(asc(tips.categoryId), asc(tips.position));
  const byCategory = new Map<string, Tip[]>();
  for (const t of allTips.filter((t) => t.isVisible)) {
    const list = byCategory.get(t.categoryId) ?? [];
    list.push(t);
    byCategory.set(t.categoryId, list);
  }
  return cats
    .map((c) => ({ ...c, tips: byCategory.get(c.id) ?? [] }))
    .filter((c) => c.tips.length > 0);
}

export async function createCategoryInDb(input: unknown): Promise<TipCategory> {
  const parsed = tipCategoryCreateSchema.parse(input);
  const [{ next }] = await db
    .select({ next: sql<number>`coalesce(max(${tipCategories.position}), -1) + 1` })
    .from(tipCategories);
  const inserted = await db
    .insert(tipCategories)
    .values({ ...parsed, position: next })
    .returning();
  return inserted[0];
}

export async function updateCategoryInDb(
  id: string,
  input: unknown,
): Promise<TipCategory | null> {
  const parsed = tipCategoryUpdateSchema.parse(input);
  if (Object.keys(parsed).length === 0) {
    const rows = await db.select().from(tipCategories).where(eq(tipCategories.id, id)).limit(1);
    return rows[0] ?? null;
  }
  const updated = await db
    .update(tipCategories)
    .set({ ...parsed, updatedAt: new Date() })
    .where(eq(tipCategories.id, id))
    .returning();
  return updated[0] ?? null;
}

export async function deleteCategoryInDb(id: string): Promise<boolean> {
  const deleted = await db
    .delete(tipCategories)
    .where(eq(tipCategories.id, id))
    .returning({ id: tipCategories.id });
  return deleted.length > 0;
}

export async function createTipInDb(input: unknown): Promise<Tip> {
  const parsed = tipCreateSchema.parse(input);
  const [{ next }] = await db
    .select({ next: sql<number>`coalesce(max(${tips.position}), -1) + 1` })
    .from(tips)
    .where(eq(tips.categoryId, parsed.categoryId));
  const inserted = await db
    .insert(tips)
    .values({ ...parsed, position: next })
    .returning();
  return inserted[0];
}

export async function updateTipInDb(
  id: string,
  input: unknown,
): Promise<Tip | null> {
  const parsed = tipUpdateSchema.parse(input);
  if (Object.keys(parsed).length === 0) {
    const rows = await db.select().from(tips).where(eq(tips.id, id)).limit(1);
    return rows[0] ?? null;
  }
  const updated = await db
    .update(tips)
    .set({ ...parsed, updatedAt: new Date() })
    .where(eq(tips.id, id))
    .returning();
  return updated[0] ?? null;
}

export async function deleteTipInDb(id: string): Promise<boolean> {
  const deleted = await db.delete(tips).where(eq(tips.id, id)).returning({ id: tips.id });
  return deleted.length > 0;
}

export async function reorderCategoriesInDb(input: unknown): Promise<TipCategory[]> {
  const parsed = reorderSchema.parse(input);
  await db.transaction(async (tx) => {
    for (let i = 0; i < parsed.ids.length; i++) {
      await tx
        .update(tipCategories)
        .set({ position: i, updatedAt: new Date() })
        .where(eq(tipCategories.id, parsed.ids[i]));
    }
  });
  return listCategories();
}

export const adminCreateCategory = withAdmin(createCategoryInDb);
export const adminUpdateCategory = withAdmin(updateCategoryInDb);
export const adminDeleteCategory = withAdmin(deleteCategoryInDb);
export const adminCreateTip = withAdmin(createTipInDb);
export const adminUpdateTip = withAdmin(updateTipInDb);
export const adminDeleteTip = withAdmin(deleteTipInDb);
export const adminReorderCategories = withAdmin(reorderCategoriesInDb);

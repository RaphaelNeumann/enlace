import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { dressCode } from "@/lib/db/schema";
import { withAdmin } from "@/lib/server-auth/with-admin";
import { dressCodeUpdateSchema } from "./schema";

const SINGLETON_ID = "default";

export type DressCode = typeof dressCode.$inferSelect;

export async function getDressCode(client: typeof db = db): Promise<DressCode> {
  const rows = await client
    .select()
    .from(dressCode)
    .where(eq(dressCode.id, SINGLETON_ID))
    .limit(1);
  if (rows.length === 0) {
    const inserted = await client
      .insert(dressCode)
      .values({ id: SINGLETON_ID })
      .returning();
    return inserted[0];
  }
  return rows[0];
}

export async function updateDressCodeInDb(
  input: unknown,
  client: typeof db = db,
): Promise<DressCode> {
  const parsed = dressCodeUpdateSchema.parse(input);
  const updated = await client
    .insert(dressCode)
    .values({ id: SINGLETON_ID, ...parsed, updatedAt: new Date() })
    .onConflictDoUpdate({
      target: dressCode.id,
      set: { ...parsed, updatedAt: new Date() },
    })
    .returning();
  return updated[0];
}

export const adminUpdateDressCode = withAdmin(updateDressCodeInDb);

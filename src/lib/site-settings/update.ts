import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { siteSettings } from "@/lib/db/schema";
import { siteSettingsUpdateSchema } from "./schema";
import type { SiteSettings } from "./get";

const SINGLETON_ID = "default";

/**
 * Pure DB-update layer. Auth (`auth()` + role assertion) is the caller's
 * responsibility — Server Actions wrap this. Keeping the DB write
 * decoupled from auth lets us unit-test behaviour without mocking auth.
 */
export async function updateSiteSettingsInDb(
  input: unknown,
  client: typeof db = db,
): Promise<SiteSettings> {
  const parsed = siteSettingsUpdateSchema.parse(input);
  const updated = await client
    .insert(siteSettings)
    .values({ id: SINGLETON_ID, ...parsed, updatedAt: new Date() })
    .onConflictDoUpdate({
      target: siteSettings.id,
      set: { ...parsed, updatedAt: new Date() },
    })
    .returning();
  if (updated.length === 0) {
    throw new Error("siteSettings update returned no rows");
  }
  return updated[0];
}

export async function getSiteSettingsRow(
  client: typeof db = db,
): Promise<SiteSettings | null> {
  const rows = await client
    .select()
    .from(siteSettings)
    .where(eq(siteSettings.id, SINGLETON_ID))
    .limit(1);
  return rows[0] ?? null;
}

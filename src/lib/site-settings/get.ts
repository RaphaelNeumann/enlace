import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { siteSettings } from "@/lib/db/schema";

const SINGLETON_ID = "default";

export type SiteSettings = typeof siteSettings.$inferSelect;

export async function getSiteSettings(
  client: typeof db = db,
): Promise<SiteSettings> {
  const rows = await client
    .select()
    .from(siteSettings)
    .where(eq(siteSettings.id, SINGLETON_ID))
    .limit(1);
  if (rows.length === 0) {
    const inserted = await client
      .insert(siteSettings)
      .values({ id: SINGLETON_ID })
      .returning();
    return inserted[0];
  }
  return rows[0];
}

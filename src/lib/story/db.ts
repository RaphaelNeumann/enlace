import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { storyContent } from "@/lib/db/schema";
import { withAdmin } from "@/lib/server-auth/with-admin";
import { storyUpdateSchema } from "./schema";

const SINGLETON_ID = "default";

export type StoryContent = typeof storyContent.$inferSelect;

export async function getStoryContent(client: typeof db = db): Promise<StoryContent> {
  const rows = await client
    .select()
    .from(storyContent)
    .where(eq(storyContent.id, SINGLETON_ID))
    .limit(1);
  if (rows.length === 0) {
    const inserted = await client
      .insert(storyContent)
      .values({ id: SINGLETON_ID })
      .returning();
    return inserted[0];
  }
  return rows[0];
}

export async function updateStoryInDb(
  input: unknown,
  client: typeof db = db,
): Promise<StoryContent> {
  const parsed = storyUpdateSchema.parse(input);
  const updated = await client
    .insert(storyContent)
    .values({ id: SINGLETON_ID, ...parsed, updatedAt: new Date() })
    .onConflictDoUpdate({
      target: storyContent.id,
      set: { ...parsed, updatedAt: new Date() },
    })
    .returning();
  return updated[0];
}

export const adminUpdateStory = withAdmin(updateStoryInDb);

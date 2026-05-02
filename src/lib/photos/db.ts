import { asc, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { photos } from "@/lib/db/schema";
import { withAdmin } from "@/lib/server-auth/with-admin";
import {
  photoCreateSchema,
  photoUpdateSchema,
  photoReorderSchema,
} from "./schema";

export type Photo = typeof photos.$inferSelect;

export async function listPhotos(
  options: { onlyVisible?: boolean } = {},
  client: typeof db = db,
): Promise<Photo[]> {
  const rows = await client
    .select()
    .from(photos)
    .orderBy(asc(photos.position), asc(photos.createdAt));
  return options.onlyVisible ? rows.filter((p) => p.isVisible) : rows;
}

export async function createPhotoInDb(input: unknown, client: typeof db = db): Promise<Photo> {
  const parsed = photoCreateSchema.parse(input);
  const [{ next }] = await client
    .select({ next: sql<number>`coalesce(max(${photos.position}), -1) + 1` })
    .from(photos);
  const inserted = await client.insert(photos).values({ ...parsed, position: next }).returning();
  return inserted[0];
}

export async function updatePhotoInDb(
  id: string,
  input: unknown,
  client: typeof db = db,
): Promise<Photo | null> {
  const parsed = photoUpdateSchema.parse(input);
  if (Object.keys(parsed).length === 0) {
    const rows = await client.select().from(photos).where(eq(photos.id, id)).limit(1);
    return rows[0] ?? null;
  }
  const updated = await client
    .update(photos)
    .set({ ...parsed, updatedAt: new Date() })
    .where(eq(photos.id, id))
    .returning();
  return updated[0] ?? null;
}

export async function deletePhotoInDb(id: string, client: typeof db = db): Promise<boolean> {
  const deleted = await client.delete(photos).where(eq(photos.id, id)).returning({ id: photos.id });
  return deleted.length > 0;
}

export async function reorderPhotosInDb(input: unknown, client: typeof db = db): Promise<Photo[]> {
  const parsed = photoReorderSchema.parse(input);
  await client.transaction(async (tx) => {
    for (let i = 0; i < parsed.ids.length; i++) {
      await tx
        .update(photos)
        .set({ position: i, updatedAt: new Date() })
        .where(eq(photos.id, parsed.ids[i]));
    }
  });
  return listPhotos({}, client);
}

export const adminCreatePhoto = withAdmin(createPhotoInDb);
export const adminUpdatePhoto = withAdmin(updatePhotoInDb);
export const adminDeletePhoto = withAdmin(deletePhotoInDb);
export const adminReorderPhotos = withAdmin(reorderPhotosInDb);

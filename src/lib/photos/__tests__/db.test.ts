import { describe, expect, it, beforeEach } from "vitest";
import { db } from "@/lib/db";
import { photos } from "@/lib/db/schema";
import {
  listPhotos,
  createPhotoInDb,
  updatePhotoInDb,
  deletePhotoInDb,
  reorderPhotosInDb,
  adminCreatePhoto,
} from "../db";
import { photoCreateSchema } from "../schema";
import { AuthorizationError } from "@/lib/server-auth/assert-role";

beforeEach(async () => {
  await db.delete(photos);
});

describe("photos", () => {
  it("rejects empty storagePath", () => {
    expect(() => photoCreateSchema.parse({ storagePath: "" })).toThrow();
  });

  it("create assigns next position", async () => {
    const a = await createPhotoInDb({ storagePath: "a.jpg" });
    const b = await createPhotoInDb({ storagePath: "b.jpg" });
    expect(a.position).toBe(0);
    expect(b.position).toBe(1);
  });

  it("update patches single field", async () => {
    const created = await createPhotoInDb({ storagePath: "x.jpg" });
    const updated = await updatePhotoInDb(created.id, { captionPt: "Eu e ele" });
    expect(updated?.captionPt).toBe("Eu e ele");
  });

  it("delete returns true / false", async () => {
    const created = await createPhotoInDb({ storagePath: "x.jpg" });
    expect(await deletePhotoInDb(created.id)).toBe(true);
    expect(await deletePhotoInDb(created.id)).toBe(false);
  });

  it("reorder rewrites positions", async () => {
    const a = await createPhotoInDb({ storagePath: "a.jpg" });
    const b = await createPhotoInDb({ storagePath: "b.jpg" });
    const c = await createPhotoInDb({ storagePath: "c.jpg" });
    const reordered = await reorderPhotosInDb({ ids: [c.id, a.id, b.id] });
    expect(reordered.map((p) => p.id)).toEqual([c.id, a.id, b.id]);
  });

  it("listPhotos onlyVisible filters out hidden rows", async () => {
    const a = await createPhotoInDb({ storagePath: "a.jpg" });
    await updatePhotoInDb(a.id, { isVisible: false });
    await createPhotoInDb({ storagePath: "b.jpg" });
    const visible = await listPhotos({ onlyVisible: true });
    expect(visible.map((p) => p.storagePath)).toEqual(["b.jpg"]);
  });

  it("admin gate for create", async () => {
    await expect(adminCreatePhoto({ storagePath: "x.jpg" }, null)).rejects.toBeInstanceOf(
      AuthorizationError,
    );
  });
});

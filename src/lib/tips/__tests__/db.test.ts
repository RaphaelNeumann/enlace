import { describe, expect, it, beforeEach } from "vitest";
import { db } from "@/lib/db";
import { tipCategories, tips } from "@/lib/db/schema";
import {
  listCategories,
  listTipsByCategory,
  listVisibleCategoriesWithTips,
  createCategoryInDb,
  updateCategoryInDb,
  deleteCategoryInDb,
  createTipInDb,
  updateTipInDb,
  deleteTipInDb,
  reorderCategoriesInDb,
  adminCreateCategory,
} from "../db";
import { tipCategoryCreateSchema, tipCreateSchema } from "../schema";
import { AuthorizationError } from "@/lib/server-auth/assert-role";

beforeEach(async () => {
  await db.delete(tips);
  await db.delete(tipCategories);
});

describe("tip schemas", () => {
  it("rejects unknown icon name", () => {
    expect(() =>
      tipCategoryCreateSchema.parse({ namePt: "Hotéis", iconName: "BogusIcon" }),
    ).toThrow();
  });
  it("accepts whitelisted icon", () => {
    const out = tipCategoryCreateSchema.parse({ namePt: "Hotéis", iconName: "Hotel" });
    expect(out.iconName).toBe("Hotel");
  });
  it("tipCreateSchema requires title and body", () => {
    expect(() =>
      tipCreateSchema.parse({
        categoryId: "00000000-0000-0000-0000-000000000000",
        titlePt: "",
        bodyPt: "",
      }),
    ).toThrow();
  });
});

describe("tips CRUD", () => {
  it("createCategoryInDb assigns next position", async () => {
    const a = await createCategoryInDb({ namePt: "Hotéis" });
    const b = await createCategoryInDb({ namePt: "Restaurantes" });
    expect(a.position).toBe(0);
    expect(b.position).toBe(1);
  });

  it("createTipInDb assigns position scoped to its category", async () => {
    const cat = await createCategoryInDb({ namePt: "Hotéis" });
    const t1 = await createTipInDb({ categoryId: cat.id, titlePt: "T1", bodyPt: "B1" });
    const t2 = await createTipInDb({ categoryId: cat.id, titlePt: "T2", bodyPt: "B2" });
    expect(t1.position).toBe(0);
    expect(t2.position).toBe(1);
  });

  it("listTipsByCategory returns ordered tips", async () => {
    const cat = await createCategoryInDb({ namePt: "X" });
    await createTipInDb({ categoryId: cat.id, titlePt: "A", bodyPt: "1" });
    await createTipInDb({ categoryId: cat.id, titlePt: "B", bodyPt: "2" });
    const list = await listTipsByCategory(cat.id);
    expect(list.map((t) => t.titlePt)).toEqual(["A", "B"]);
  });

  it("update / delete category cascade-deletes its tips", async () => {
    const cat = await createCategoryInDb({ namePt: "X" });
    await createTipInDb({ categoryId: cat.id, titlePt: "A", bodyPt: "1" });
    expect(await deleteCategoryInDb(cat.id)).toBe(true);
    expect(await listTipsByCategory(cat.id)).toEqual([]);
  });

  it("listVisibleCategoriesWithTips hides empty categories", async () => {
    const a = await createCategoryInDb({ namePt: "Tem dicas" });
    await createCategoryInDb({ namePt: "Sem dicas" });
    await createTipInDb({ categoryId: a.id, titlePt: "T", bodyPt: "B" });
    const list = await listVisibleCategoriesWithTips();
    expect(list.map((c) => c.id)).toEqual([a.id]);
    expect(list[0].tips).toHaveLength(1);
  });

  it("listVisibleCategoriesWithTips skips hidden categories and hidden tips", async () => {
    const a = await createCategoryInDb({ namePt: "Hotéis" });
    await updateCategoryInDb(a.id, { isVisible: false });
    await createTipInDb({ categoryId: a.id, titlePt: "T", bodyPt: "B" });
    expect(await listVisibleCategoriesWithTips()).toEqual([]);

    const b = await createCategoryInDb({ namePt: "Restaurantes" });
    const t1 = await createTipInDb({ categoryId: b.id, titlePt: "Visible", bodyPt: "Y" });
    await updateTipInDb(t1.id, { isVisible: false });
    expect(await listVisibleCategoriesWithTips()).toEqual([]);
  });

  it("reorderCategoriesInDb rewrites positions", async () => {
    const a = await createCategoryInDb({ namePt: "A" });
    const b = await createCategoryInDb({ namePt: "B" });
    const c = await createCategoryInDb({ namePt: "C" });
    const reordered = await reorderCategoriesInDb({ ids: [c.id, a.id, b.id] });
    expect(reordered.map((x) => x.id)).toEqual([c.id, a.id, b.id]);
  });

  it("update tip is partial and updates updatedAt", async () => {
    const cat = await createCategoryInDb({ namePt: "X" });
    const t = await createTipInDb({ categoryId: cat.id, titlePt: "Old", bodyPt: "B" });
    const updated = await updateTipInDb(t.id, { titlePt: "New" });
    expect(updated?.titlePt).toBe("New");
    expect(updated?.bodyPt).toBe("B");
  });

  it("delete tip returns false for unknown id", async () => {
    expect(await deleteTipInDb("00000000-0000-0000-0000-000000000000")).toBe(false);
  });

  it("admin gate for category create", async () => {
    await expect(adminCreateCategory({ namePt: "X" }, null)).rejects.toBeInstanceOf(
      AuthorizationError,
    );
  });

  it("listCategories returns empty on fresh schema", async () => {
    expect(await listCategories()).toEqual([]);
  });
});

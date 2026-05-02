import { describe, expect, it, beforeEach } from "vitest";
import { db } from "@/lib/db";
import { faqEntries } from "@/lib/db/schema";
import {
  listFaq,
  createFaqInDb,
  updateFaqInDb,
  deleteFaqInDb,
  reorderFaqInDb,
  adminCreateFaq,
} from "../db";
import { faqCreateSchema } from "../schema";
import { AuthorizationError } from "@/lib/server-auth/assert-role";

beforeEach(async () => {
  await db.delete(faqEntries);
});

describe("faqCreateSchema", () => {
  it("requires non-empty question and answer", () => {
    expect(() => faqCreateSchema.parse({ questionPt: "", answerPt: "" })).toThrow();
  });

  it("trims values and accepts EN as optional", () => {
    const out = faqCreateSchema.parse({
      questionPt: "  Como vamos? ",
      answerPt: "  Bem!  ",
    });
    expect(out.questionPt).toBe("Como vamos?");
    expect(out.answerPt).toBe("Bem!");
    expect(out.questionEn ?? null).toBeNull();
  });

  it("defaults isVisible to true", () => {
    const out = faqCreateSchema.parse({ questionPt: "Q", answerPt: "A" });
    expect(out.isVisible).toBe(true);
  });
});

describe("faq DB", () => {
  it("listFaq returns empty when no rows exist", async () => {
    expect(await listFaq()).toEqual([]);
  });

  it("createFaqInDb inserts and assigns the next position", async () => {
    const a = await createFaqInDb({ questionPt: "A?", answerPt: "yes" });
    const b = await createFaqInDb({ questionPt: "B?", answerPt: "no" });
    expect(a.position).toBe(0);
    expect(b.position).toBe(1);
    const all = await listFaq();
    expect(all).toHaveLength(2);
    expect(all[0].id).toBe(a.id);
    expect(all[1].id).toBe(b.id);
  });

  it("updateFaqInDb patches a single field", async () => {
    const created = await createFaqInDb({ questionPt: "Old", answerPt: "A" });
    const updated = await updateFaqInDb(created.id, { questionPt: "New" });
    expect(updated?.questionPt).toBe("New");
    expect(updated?.answerPt).toBe("A");
  });

  it("updateFaqInDb returns null for unknown id", async () => {
    const result = await updateFaqInDb(
      "00000000-0000-0000-0000-000000000000",
      { questionPt: "X" },
    );
    expect(result).toBeNull();
  });

  it("updateFaqInDb on empty patch returns the existing row unchanged", async () => {
    const created = await createFaqInDb({ questionPt: "Q", answerPt: "A" });
    const result = await updateFaqInDb(created.id, {});
    expect(result?.questionPt).toBe("Q");
  });

  it("deleteFaqInDb removes the row and returns true", async () => {
    const created = await createFaqInDb({ questionPt: "Q", answerPt: "A" });
    expect(await deleteFaqInDb(created.id)).toBe(true);
    expect(await listFaq()).toEqual([]);
  });

  it("deleteFaqInDb returns false for unknown id", async () => {
    expect(
      await deleteFaqInDb("00000000-0000-0000-0000-000000000000"),
    ).toBe(false);
  });

  it("reorderFaqInDb reassigns positions in the supplied order", async () => {
    const a = await createFaqInDb({ questionPt: "A?", answerPt: "1" });
    const b = await createFaqInDb({ questionPt: "B?", answerPt: "2" });
    const c = await createFaqInDb({ questionPt: "C?", answerPt: "3" });
    const reordered = await reorderFaqInDb({ ids: [c.id, a.id, b.id] });
    expect(reordered.map((r) => r.id)).toEqual([c.id, a.id, b.id]);
    expect(reordered.map((r) => r.position)).toEqual([0, 1, 2]);
  });

  it("listFaq with onlyVisible filters out hidden entries", async () => {
    const a = await createFaqInDb({ questionPt: "A?", answerPt: "1" });
    await updateFaqInDb(a.id, { isVisible: false });
    await createFaqInDb({ questionPt: "B?", answerPt: "2" });
    const visible = await listFaq({ onlyVisible: true });
    expect(visible.map((r) => r.questionPt)).toEqual(["B?"]);
  });

  it("adminCreateFaq throws on missing session", async () => {
    await expect(
      adminCreateFaq({ questionPt: "Q", answerPt: "A" }, null),
    ).rejects.toBeInstanceOf(AuthorizationError);
  });

  it("adminCreateFaq inserts with admin session", async () => {
    const created = await adminCreateFaq(
      { questionPt: "Q?", answerPt: "A" },
      { user: { role: "COUPLE" } },
    );
    expect(created.questionPt).toBe("Q?");
  });
});

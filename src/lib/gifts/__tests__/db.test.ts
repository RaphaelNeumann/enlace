import { describe, expect, it, beforeEach } from "vitest";
import { db } from "@/lib/db";
import { gifts, giftMessages } from "@/lib/db/schema";
import {
  listGifts,
  getGift,
  createGiftInDb,
  updateGiftInDb,
  deleteGiftInDb,
  reorderGiftsInDb,
  createGiftMessageInDb,
  listGiftMessages,
  adminCreateGift,
} from "../db";
import { giftCreateSchema, giftMessageCreateSchema } from "../schema";
import { AuthorizationError } from "@/lib/server-auth/assert-role";

beforeEach(async () => {
  await db.delete(giftMessages);
  await db.delete(gifts);
});

describe("gift schemas", () => {
  it("requires titlePt", () => {
    expect(() => giftCreateSchema.parse({ titlePt: "" })).toThrow();
  });
  it("rejects http external URL", () => {
    expect(() =>
      giftCreateSchema.parse({ titlePt: "T", externalUrl: "http://x" }),
    ).toThrow();
  });
  it("accepts https external URL", () => {
    const out = giftCreateSchema.parse({
      titlePt: "T",
      externalUrl: "https://magalu.com.br/x",
    });
    expect(out.externalUrl).toBe("https://magalu.com.br/x");
  });
  it("rejects negative suggestedAmountCents", () => {
    expect(() =>
      giftCreateSchema.parse({ titlePt: "T", suggestedAmountCents: -10 }),
    ).toThrow();
  });
  it("giftMessageCreateSchema requires sender + message", () => {
    expect(() =>
      giftMessageCreateSchema.parse({ senderName: "", message: "" }),
    ).toThrow();
    expect(
      giftMessageCreateSchema.parse({ senderName: "Maria", message: "Parabéns!" }).senderName,
    ).toBe("Maria");
  });
});

describe("gifts CRUD", () => {
  it("listGifts empty initially", async () => {
    expect(await listGifts()).toEqual([]);
  });
  it("create assigns next position", async () => {
    const a = await createGiftInDb({ titlePt: "A" });
    const b = await createGiftInDb({ titlePt: "B" });
    expect(a.position).toBe(0);
    expect(b.position).toBe(1);
  });
  it("update patches a single field", async () => {
    const created = await createGiftInDb({ titlePt: "Old" });
    const updated = await updateGiftInDb(created.id, { titlePt: "New" });
    expect(updated?.titlePt).toBe("New");
  });
  it("update returns null for unknown id", async () => {
    expect(
      await updateGiftInDb("00000000-0000-0000-0000-000000000000", { titlePt: "X" }),
    ).toBeNull();
  });
  it("delete returns true / false correctly", async () => {
    const created = await createGiftInDb({ titlePt: "X" });
    expect(await deleteGiftInDb(created.id)).toBe(true);
    expect(await deleteGiftInDb(created.id)).toBe(false);
  });
  it("reorder rewrites positions in array order", async () => {
    const a = await createGiftInDb({ titlePt: "A" });
    const b = await createGiftInDb({ titlePt: "B" });
    const c = await createGiftInDb({ titlePt: "C" });
    const reordered = await reorderGiftsInDb({ ids: [c.id, a.id, b.id] });
    expect(reordered.map((g) => g.id)).toEqual([c.id, a.id, b.id]);
    expect(reordered.map((g) => g.position)).toEqual([0, 1, 2]);
  });
  it("listGifts onlyVisible filters hidden", async () => {
    const a = await createGiftInDb({ titlePt: "A" });
    await updateGiftInDb(a.id, { isVisible: false });
    await createGiftInDb({ titlePt: "B" });
    const visible = await listGifts({ onlyVisible: true });
    expect(visible.map((g) => g.titlePt)).toEqual(["B"]);
  });
  it("admin gate refuses without session", async () => {
    await expect(adminCreateGift({ titlePt: "X" }, null)).rejects.toBeInstanceOf(
      AuthorizationError,
    );
  });
  it("getGift returns null for unknown id", async () => {
    expect(await getGift("00000000-0000-0000-0000-000000000000")).toBeNull();
  });
});

describe("gift messages", () => {
  it("createGiftMessageInDb persists with optional giftId", async () => {
    const gift = await createGiftInDb({ titlePt: "X" });
    const msg = await createGiftMessageInDb({
      giftId: gift.id,
      senderName: "Maria",
      message: "Parabéns!",
    });
    expect(msg.giftId).toBe(gift.id);
    expect(msg.senderName).toBe("Maria");
  });

  it("createGiftMessageInDb accepts null giftId for guestbook-style notes", async () => {
    const msg = await createGiftMessageInDb({
      senderName: "Maria",
      message: "Felicidades!",
    });
    expect(msg.giftId).toBeNull();
  });

  it("listGiftMessages orders newest first", async () => {
    await createGiftMessageInDb({ senderName: "A", message: "1" });
    await new Promise((r) => setTimeout(r, 5));
    await createGiftMessageInDb({ senderName: "B", message: "2" });
    const list = await listGiftMessages();
    expect(list[0].senderName).toBe("B");
    expect(list[1].senderName).toBe("A");
  });

  it("ON DELETE SET NULL preserves the message when its gift is deleted", async () => {
    const gift = await createGiftInDb({ titlePt: "X" });
    await createGiftMessageInDb({ giftId: gift.id, senderName: "M", message: "Z" });
    await deleteGiftInDb(gift.id);
    const list = await listGiftMessages();
    expect(list).toHaveLength(1);
    expect(list[0].giftId).toBeNull();
  });
});

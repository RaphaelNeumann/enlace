"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import {
  adminCreateGift,
  adminUpdateGift,
  adminDeleteGift,
} from "@/lib/gifts/db";

function fdToObj(formData: FormData): Record<string, unknown> {
  const obj: Record<string, unknown> = {};
  for (const [key, value] of formData.entries()) {
    if (typeof value === "string") {
      if (value === "on") obj[key] = true;
      else if (value === "") obj[key] = null;
      else obj[key] = value;
    }
  }
  if (typeof obj.suggestedAmountCents === "string") {
    const n = Number(obj.suggestedAmountCents);
    obj.suggestedAmountCents = Number.isFinite(n) ? n : null;
  }
  return obj;
}

export async function createGiftAction(formData: FormData): Promise<void> {
  const session = await auth();
  const obj = fdToObj(formData);
  obj.isVisible = obj.isVisible === true;
  await adminCreateGift(obj, session);
  revalidatePath("/", "layout");
  revalidatePath("/admin/gifts");
}

export async function updateGiftAction(id: string, formData: FormData): Promise<void> {
  const session = await auth();
  const obj = fdToObj(formData);
  obj.isVisible = obj.isVisible === true;
  await adminUpdateGift(id, obj, session);
  revalidatePath("/", "layout");
  revalidatePath("/admin/gifts");
}

export async function deleteGiftAction(id: string): Promise<void> {
  const session = await auth();
  await adminDeleteGift(id, session);
  revalidatePath("/", "layout");
  revalidatePath("/admin/gifts");
}

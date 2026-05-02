"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { adminCreateFaq, adminUpdateFaq, adminDeleteFaq, adminReorderFaq } from "@/lib/faq/db";

function fdToObj(formData: FormData): Record<string, unknown> {
  const obj: Record<string, unknown> = {};
  for (const [key, value] of formData.entries()) {
    if (typeof value === "string") {
      if (value === "on") obj[key] = true;
      else if (value === "") obj[key] = null;
      else obj[key] = value;
    }
  }
  return obj;
}

export async function createFaqAction(formData: FormData): Promise<void> {
  const session = await auth();
  const obj = fdToObj(formData);
  obj.isVisible = obj.isVisible === true;
  await adminCreateFaq(obj, session);
  revalidatePath("/", "layout");
  revalidatePath("/admin/faq");
}

export async function updateFaqAction(id: string, formData: FormData): Promise<void> {
  const session = await auth();
  const obj = fdToObj(formData);
  obj.isVisible = obj.isVisible === true;
  await adminUpdateFaq(id, obj, session);
  revalidatePath("/", "layout");
  revalidatePath("/admin/faq");
}

export async function deleteFaqAction(id: string): Promise<void> {
  const session = await auth();
  await adminDeleteFaq(id, session);
  revalidatePath("/", "layout");
  revalidatePath("/admin/faq");
}

export async function reorderFaqAction(ids: string[]): Promise<void> {
  const session = await auth();
  await adminReorderFaq({ ids }, session);
  revalidatePath("/", "layout");
  revalidatePath("/admin/faq");
}

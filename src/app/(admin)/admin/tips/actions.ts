"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import {
  adminCreateCategory,
  adminUpdateCategory,
  adminDeleteCategory,
  adminCreateTip,
  adminUpdateTip,
  adminDeleteTip,
} from "@/lib/tips/db";

const NULLABLE = new Set(["nameEn", "iconName", "titleEn", "bodyEn", "externalUrl"]);

function fdToObj(formData: FormData): Record<string, unknown> {
  const obj: Record<string, unknown> = {};
  for (const [key, value] of formData.entries()) {
    if (typeof value !== "string") continue;
    if (value === "on") obj[key] = true;
    else if (value === "" && NULLABLE.has(key)) obj[key] = null;
    else obj[key] = value;
  }
  return obj;
}

export async function createCategoryAction(formData: FormData): Promise<void> {
  const session = await auth();
  const obj = fdToObj(formData);
  obj.isVisible = obj.isVisible === true;
  await adminCreateCategory(obj, session);
  revalidatePath("/", "layout");
  revalidatePath("/admin/tips");
}
export async function updateCategoryAction(id: string, formData: FormData): Promise<void> {
  const session = await auth();
  const obj = fdToObj(formData);
  obj.isVisible = obj.isVisible === true;
  await adminUpdateCategory(id, obj, session);
  revalidatePath("/", "layout");
  revalidatePath("/admin/tips");
}
export async function deleteCategoryAction(id: string): Promise<void> {
  const session = await auth();
  await adminDeleteCategory(id, session);
  revalidatePath("/", "layout");
  revalidatePath("/admin/tips");
}
export async function createTipAction(formData: FormData): Promise<void> {
  const session = await auth();
  const obj = fdToObj(formData);
  obj.isVisible = obj.isVisible === true;
  await adminCreateTip(obj, session);
  revalidatePath("/", "layout");
  revalidatePath("/admin/tips");
}
export async function updateTipAction(id: string, formData: FormData): Promise<void> {
  const session = await auth();
  const obj = fdToObj(formData);
  obj.isVisible = obj.isVisible === true;
  await adminUpdateTip(id, obj, session);
  revalidatePath("/", "layout");
  revalidatePath("/admin/tips");
}
export async function deleteTipAction(id: string): Promise<void> {
  const session = await auth();
  await adminDeleteTip(id, session);
  revalidatePath("/", "layout");
  revalidatePath("/admin/tips");
}

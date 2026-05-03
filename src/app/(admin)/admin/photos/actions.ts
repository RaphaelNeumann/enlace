"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import {
  adminCreatePhoto,
  adminUpdatePhoto,
  adminDeletePhoto,
} from "@/lib/photos/db";

const NULLABLE = new Set(["captionPt", "captionEn"]);

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

export async function createPhotoAction(formData: FormData): Promise<void> {
  const session = await auth();
  const obj = fdToObj(formData);
  obj.isVisible = obj.isVisible === true;
  await adminCreatePhoto(obj, session);
  revalidatePath("/", "layout");
  revalidatePath("/admin/photos");
}

export async function updatePhotoAction(id: string, formData: FormData): Promise<void> {
  const session = await auth();
  const obj = fdToObj(formData);
  obj.isVisible = obj.isVisible === true;
  await adminUpdatePhoto(id, obj, session);
  revalidatePath("/", "layout");
  revalidatePath("/admin/photos");
}

export async function deletePhotoAction(id: string): Promise<void> {
  const session = await auth();
  await adminDeletePhoto(id, session);
  revalidatePath("/", "layout");
  revalidatePath("/admin/photos");
}

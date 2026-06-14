"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { CONTENT_TAGS } from "@/lib/content-tags";
import { auth } from "@/lib/auth";
import { adminUpdateDressCode } from "@/lib/dress-code/db";

const NULLABLE = new Set([
  "headlineEn",
  "introEn",
  "womenTitleEn",
  "womenBodyEn",
  "menTitleEn",
  "menBodyEn",
  "womenIconImageStoragePath",
  "menIconImageStoragePath",
]);

export async function updateDressCodeAction(formData: FormData): Promise<void> {
  const session = await auth();
  const obj: Record<string, unknown> = {};
  for (const [key, value] of formData.entries()) {
    if (typeof value !== "string") continue;
    obj[key] = value === "" && NULLABLE.has(key) ? null : value;
  }
  await adminUpdateDressCode(obj, session);
  revalidatePath("/", "layout");
  revalidateTag(CONTENT_TAGS.dressCode, "max");
  revalidatePath("/admin/dress-code");
}

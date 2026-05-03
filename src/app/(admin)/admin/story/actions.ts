"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { adminUpdateStory } from "@/lib/story/db";

const NULLABLE = new Set([
  "bodyEn",
  "photo1StoragePath",
  "photo2StoragePath",
  "photo3StoragePath",
]);

export async function updateStoryAction(formData: FormData): Promise<void> {
  const session = await auth();
  const obj: Record<string, unknown> = {};
  for (const [key, value] of formData.entries()) {
    if (typeof value !== "string") continue;
    obj[key] = value === "" && NULLABLE.has(key) ? null : value;
  }
  await adminUpdateStory(obj, session);
  revalidatePath("/", "layout");
  revalidatePath("/admin/story");
}

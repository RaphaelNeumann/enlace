"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { adminUpdateStory } from "@/lib/story/db";

export async function updateStoryAction(formData: FormData): Promise<void> {
  const session = await auth();
  const obj: Record<string, unknown> = {};
  for (const [key, value] of formData.entries()) {
    if (typeof value === "string") obj[key] = value === "" ? null : value;
  }
  await adminUpdateStory(obj, session);
  revalidatePath("/", "layout");
  revalidatePath("/admin/story");
}

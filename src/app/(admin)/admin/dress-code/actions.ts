"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { adminUpdateDressCode } from "@/lib/dress-code/db";

export async function updateDressCodeAction(formData: FormData): Promise<void> {
  const session = await auth();
  const obj: Record<string, unknown> = {};
  for (const [key, value] of formData.entries()) {
    if (typeof value === "string") obj[key] = value === "" ? null : value;
  }
  await adminUpdateDressCode(obj, session);
  revalidatePath("/", "layout");
  revalidatePath("/admin/dress-code");
}

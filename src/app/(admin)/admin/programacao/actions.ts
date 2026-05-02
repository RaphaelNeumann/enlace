"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { adminUpdateProgramacaoCard } from "@/lib/programacao/db";

export async function updateCardAction(id: "ceremony" | "reception", formData: FormData): Promise<void> {
  const session = await auth();
  const obj: Record<string, unknown> = {};
  for (const [key, value] of formData.entries()) {
    if (typeof value === "string") obj[key] = value === "" ? null : value;
  }
  await adminUpdateProgramacaoCard(id, obj, session);
  revalidatePath("/", "layout");
  revalidatePath("/admin/programacao");
}

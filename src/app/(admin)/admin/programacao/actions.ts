"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { adminUpdateProgramacaoCard } from "@/lib/programacao/db";

const NULLABLE = new Set(["titleEn", "addressEn", "mapsUrl", "date"]);

export async function updateCardAction(id: "ceremony" | "reception", formData: FormData): Promise<void> {
  const session = await auth();
  const obj: Record<string, unknown> = {};
  for (const [key, value] of formData.entries()) {
    if (typeof value !== "string") continue;
    obj[key] = value === "" && NULLABLE.has(key) ? null : value;
  }
  await adminUpdateProgramacaoCard(id, obj, session);
  revalidatePath("/", "layout");
  revalidatePath("/admin/programacao");
}

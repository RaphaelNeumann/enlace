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
    if (value === "on") obj[key] = true;
    else if (value === "" && NULLABLE.has(key)) obj[key] = null;
    else obj[key] = value;
  }
  // Checkboxes that aren't ticked don't post — default to false explicitly.
  if (obj.isVisible !== true) obj.isVisible = false;
  await adminUpdateProgramacaoCard(id, obj, session);
  revalidatePath("/", "layout");
  revalidatePath("/admin/programacao");
}

"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import {
  adminCreateGuest,
  adminUpdateGuest,
  adminDeleteGuest,
  adminSetRsvpStatus,
} from "@/lib/guests/db";
import { adminReplacePlusOnesForGuest } from "@/lib/plus-ones/db";

const NULLABLE = new Set(["observation"]);

function fdToObj(formData: FormData): Record<string, unknown> {
  const obj: Record<string, unknown> = {};
  for (const [key, value] of formData.entries()) {
    if (typeof value !== "string") continue;
    obj[key] = value === "" && NULLABLE.has(key) ? null : value;
  }
  return obj;
}

export async function createGuestAction(formData: FormData): Promise<void> {
  const session = await auth();
  const obj = fdToObj(formData);
  if (typeof obj.plusOnesAllowed === "string") {
    obj.plusOnesAllowed = Number(obj.plusOnesAllowed) || 0;
  }
  await adminCreateGuest(obj, session);
  revalidatePath("/admin/guests");
  revalidatePath("/admin/rsvps");
}

export async function updateGuestAction(id: string, formData: FormData): Promise<void> {
  const session = await auth();
  const obj = fdToObj(formData);
  if (typeof obj.plusOnesAllowed === "string") {
    obj.plusOnesAllowed = Number(obj.plusOnesAllowed) || 0;
  }
  await adminUpdateGuest(id, obj, session);
  revalidatePath("/admin/guests");
  revalidatePath("/admin/rsvps");
  revalidatePath("/admin/observations");
}

export async function deleteGuestAction(id: string): Promise<void> {
  const session = await auth();
  await adminDeleteGuest(id, session);
  revalidatePath("/admin/guests");
  revalidatePath("/admin/rsvps");
}

export async function setStatusAction(
  id: string,
  status: "pending" | "confirmed" | "declined",
): Promise<void> {
  const session = await auth();
  await adminSetRsvpStatus(id, status, session);
  revalidatePath("/admin/guests");
  revalidatePath("/admin/rsvps");
  revalidatePath("/admin/observations");
}

export async function replacePlusOnesAction(
  guestId: string,
  names: string[],
): Promise<void> {
  const session = await auth();
  await adminReplacePlusOnesForGuest(guestId, names, session);
  revalidatePath("/admin/guests");
  revalidatePath("/admin/rsvps");
}

"use server";

import { auth } from "@/lib/auth";
import { isAdminRole } from "@/lib/server-auth/assert-role";
import { createSupabaseStorage } from "@/lib/storage/supabase";
import { randomBytes } from "node:crypto";

export interface SignUploadResult {
  ok: true;
  signedUrl: string;
  token: string;
  storagePath: string;
  publicUrl: string;
}

export type SignUploadError =
  | { ok: false; error: "forbidden" }
  | { ok: false; error: "not_configured" }
  | { ok: false; error: "invalid_input" }
  | { ok: false; error: "upstream"; message: string };

const ALLOWED_BUCKETS = ["site", "gallery", "gifts"] as const;
type Bucket = (typeof ALLOWED_BUCKETS)[number];

function isAllowedBucket(value: unknown): value is Bucket {
  return typeof value === "string" && (ALLOWED_BUCKETS as readonly string[]).includes(value);
}

function safeExtension(filename: string): string {
  const m = filename.toLowerCase().match(/\.([a-z0-9]{1,8})$/);
  if (!m) return "bin";
  return m[1];
}

export async function signUploadAction(
  bucket: string,
  filename: string,
): Promise<SignUploadResult | SignUploadError> {
  const session = await auth();
  if (!isAdminRole(session?.user?.role)) return { ok: false, error: "forbidden" };
  if (!isAllowedBucket(bucket) || typeof filename !== "string" || filename.length === 0) {
    return { ok: false, error: "invalid_input" };
  }
  const projectUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!projectUrl || !serviceRoleKey) return { ok: false, error: "not_configured" };
  const path = `${randomBytes(8).toString("hex")}.${safeExtension(filename)}`;
  try {
    const storage = createSupabaseStorage({ projectUrl, serviceRoleKey });
    const { signedUrl, token } = await storage.signUploadUrl({ bucket, path });
    return {
      ok: true,
      signedUrl,
      token,
      storagePath: path,
      publicUrl: storage.publicUrl(bucket, path),
    };
  } catch (err) {
    return { ok: false, error: "upstream", message: err instanceof Error ? err.message : "unknown" };
  }
}

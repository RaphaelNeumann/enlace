export class SupabaseStorageError extends Error {
  status: number;
  body: unknown;
  constructor(status: number, body: unknown) {
    super(`Supabase Storage request failed (${status})`);
    this.name = "SupabaseStorageError";
    this.status = status;
    this.body = body;
  }
}

export interface SupabaseStorageOptions {
  projectUrl: string;
  serviceRoleKey: string;
}

export interface PublicUrlInput {
  projectUrl: string;
  bucket: string;
  path: string;
}

export function publicUrl(input: PublicUrlInput): string {
  const cleanPath = input.path.replace(/^\/+/, "");
  return `${input.projectUrl.replace(/\/$/, "")}/storage/v1/object/public/${input.bucket}/${cleanPath}`;
}

export interface SignUploadInput {
  bucket: string;
  path: string;
}

export interface SignedUpload {
  signedUrl: string;
  token: string;
}

export interface RemoveInput {
  bucket: string;
  paths: string[];
}

export interface SupabaseStorage {
  signUploadUrl(input: SignUploadInput): Promise<SignedUpload>;
  remove(input: RemoveInput): Promise<boolean>;
  publicUrl(bucket: string, path: string): string;
}

export function createSupabaseStorage(options: SupabaseStorageOptions): SupabaseStorage {
  const projectUrl = options.projectUrl?.trim().replace(/\/$/, "");
  const serviceRoleKey = options.serviceRoleKey?.trim();
  if (!projectUrl) throw new Error("createSupabaseStorage: projectUrl is required");
  if (!serviceRoleKey) throw new Error("createSupabaseStorage: serviceRoleKey is required");

  return {
    publicUrl(bucket, path) {
      return publicUrl({ projectUrl, bucket, path });
    },
    async signUploadUrl(input) {
      const bucket = input.bucket?.trim();
      const path = input.path?.trim().replace(/^\/+/, "");
      if (!bucket) throw new Error("signUploadUrl: bucket is required");
      if (!path) throw new Error("signUploadUrl: path is required");
      const endpoint = `${projectUrl}/storage/v1/object/upload/sign/${bucket}/${path}`;
      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          // The new Supabase API key model (sb_secret_…) requires both
          // headers; the JS SDK sends them too. Older JWT service_role
          // keys also accept this combo.
          apikey: serviceRoleKey,
          Authorization: `Bearer ${serviceRoleKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      });
      let json: unknown = null;
      try {
        json = await res.json();
      } catch {
        // ignore
      }
      if (!res.ok) {
        throw new SupabaseStorageError(res.status, json);
      }
      const obj = json as { url?: string; token?: string };
      const relativeUrl = obj.url ?? "";
      // The API returns the URL relative to /storage/v1 (e.g.
      // "/object/upload/sign/<bucket>/<path>?token=…"). Prepend the
      // project origin AND the missing /storage/v1 segment so the PUT
      // hits the actual storage endpoint.
      let signedUrl: string;
      if (relativeUrl.startsWith("http")) {
        signedUrl = relativeUrl;
      } else if (relativeUrl.startsWith("/storage/v1")) {
        signedUrl = `${projectUrl}${relativeUrl}`;
      } else {
        signedUrl = `${projectUrl}/storage/v1${relativeUrl}`;
      }
      return { signedUrl, token: obj.token ?? "" };
    },
    async remove(input) {
      const bucket = input.bucket?.trim();
      if (!bucket) throw new Error("remove: bucket is required");
      const paths = (input.paths ?? []).filter((p) => p && p.length > 0);
      if (paths.length === 0) return true;
      const endpoint = `${projectUrl}/storage/v1/object/${bucket}`;
      const res = await fetch(endpoint, {
        method: "DELETE",
        headers: {
          apikey: serviceRoleKey,
          Authorization: `Bearer ${serviceRoleKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prefixes: paths }),
      });
      return res.ok;
    },
  };
}

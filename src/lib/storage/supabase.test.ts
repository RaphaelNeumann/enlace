import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { createSupabaseStorage, SupabaseStorageError, publicUrl } from "./supabase";

const server = setupServer();
beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe("publicUrl", () => {
  it("builds a public bucket URL", () => {
    expect(
      publicUrl({ projectUrl: "https://abc.supabase.co", bucket: "gallery", path: "foo/bar.jpg" }),
    ).toBe("https://abc.supabase.co/storage/v1/object/public/gallery/foo/bar.jpg");
  });

  it("normalizes leading slashes in path", () => {
    expect(
      publicUrl({ projectUrl: "https://abc.supabase.co", bucket: "g", path: "/x.jpg" }),
    ).toBe("https://abc.supabase.co/storage/v1/object/public/g/x.jpg");
  });
});

describe("createSupabaseStorage.signUploadUrl", () => {
  it("calls the upload-sign endpoint with the service-role key", async () => {
    server.use(
      http.post(
        "https://abc.supabase.co/storage/v1/object/upload/sign/gallery/photos/x.jpg",
        ({ request }) => {
          expect(request.headers.get("authorization")).toBe("Bearer SERVICE_ROLE");
          return HttpResponse.json({
            url: "/storage/v1/object/upload/sign/gallery/photos/x.jpg?token=signed",
            token: "signed-token",
          });
        },
      ),
    );
    const storage = createSupabaseStorage({
      projectUrl: "https://abc.supabase.co",
      serviceRoleKey: "SERVICE_ROLE",
    });
    const result = await storage.signUploadUrl({
      bucket: "gallery",
      path: "photos/x.jpg",
    });
    expect(result.signedUrl).toBe(
      "https://abc.supabase.co/storage/v1/object/upload/sign/gallery/photos/x.jpg?token=signed",
    );
    expect(result.token).toBe("signed-token");
  });

  it("throws SupabaseStorageError on non-2xx", async () => {
    server.use(
      http.post(
        "https://abc.supabase.co/storage/v1/object/upload/sign/gallery/x.jpg",
        () => HttpResponse.json({ error: "nope" }, { status: 403 }),
      ),
    );
    const storage = createSupabaseStorage({
      projectUrl: "https://abc.supabase.co",
      serviceRoleKey: "SERVICE_ROLE",
    });
    await expect(
      storage.signUploadUrl({ bucket: "gallery", path: "x.jpg" }),
    ).rejects.toBeInstanceOf(SupabaseStorageError);
  });

  it("rejects empty bucket / path", async () => {
    const storage = createSupabaseStorage({
      projectUrl: "https://abc.supabase.co",
      serviceRoleKey: "S",
    });
    await expect(storage.signUploadUrl({ bucket: "", path: "x" })).rejects.toThrow();
    await expect(storage.signUploadUrl({ bucket: "g", path: "" })).rejects.toThrow();
  });
});

describe("createSupabaseStorage.delete", () => {
  it("calls DELETE /storage/v1/object/<bucket> with the path payload", async () => {
    let captured: unknown = null;
    server.use(
      http.delete(
        "https://abc.supabase.co/storage/v1/object/gallery",
        async ({ request }) => {
          captured = await request.json();
          return HttpResponse.json([{ name: "photos/x.jpg" }]);
        },
      ),
    );
    const storage = createSupabaseStorage({
      projectUrl: "https://abc.supabase.co",
      serviceRoleKey: "S",
    });
    await storage.remove({ bucket: "gallery", paths: ["photos/x.jpg"] });
    expect(captured).toEqual({ prefixes: ["photos/x.jpg"] });
  });

  it("returns false on non-2xx delete (best-effort)", async () => {
    server.use(
      http.delete("https://abc.supabase.co/storage/v1/object/gallery", () =>
        HttpResponse.json({ error: "missing" }, { status: 404 }),
      ),
    );
    const storage = createSupabaseStorage({
      projectUrl: "https://abc.supabase.co",
      serviceRoleKey: "S",
    });
    expect(await storage.remove({ bucket: "gallery", paths: ["x.jpg"] })).toBe(false);
  });
});

describe("constructor validation", () => {
  it("rejects empty projectUrl", () => {
    expect(() => createSupabaseStorage({ projectUrl: "", serviceRoleKey: "x" })).toThrow();
  });
  it("rejects empty serviceRoleKey", () => {
    expect(() =>
      createSupabaseStorage({ projectUrl: "https://x.supabase.co", serviceRoleKey: "" }),
    ).toThrow();
  });
});

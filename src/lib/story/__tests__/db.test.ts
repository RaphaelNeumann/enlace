import { describe, expect, it, beforeEach } from "vitest";
import { db } from "@/lib/db";
import { storyContent } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getStoryContent, updateStoryInDb, adminUpdateStory } from "../db";
import { storyUpdateSchema } from "../schema";
import { AuthorizationError } from "@/lib/server-auth/assert-role";

beforeEach(async () => {
  await db.delete(storyContent).where(eq(storyContent.id, "default"));
});

describe("storyUpdateSchema", () => {
  it("accepts empty input and fills defaults", () => {
    const out = storyUpdateSchema.parse({});
    expect(out.bodyPt).toBe("");
    expect(out.photo1StoragePath ?? null).toBeNull();
  });

  it("rejects body over the cap", () => {
    expect(() =>
      storyUpdateSchema.parse({ bodyPt: "a".repeat(3001) }),
    ).toThrow();
  });

  it("accepts null storage paths", () => {
    const out = storyUpdateSchema.parse({
      photo1StoragePath: null,
      photo2StoragePath: null,
      photo3StoragePath: null,
    });
    expect(out.photo1StoragePath).toBeNull();
  });
});

describe("story DB", () => {
  it("getStoryContent lazily creates the singleton", async () => {
    const story = await getStoryContent();
    expect(story.id).toBe("default");
    expect(story.bodyPt).toBe("");
  });

  it("updateStoryInDb upserts and returns the persisted row", async () => {
    const out = await updateStoryInDb({
      bodyPt: "Era uma vez...",
      photo1StoragePath: "story/p1.jpg",
    });
    expect(out.bodyPt).toBe("Era uma vez...");
    expect(out.photo1StoragePath).toBe("story/p1.jpg");
  });

  it("adminUpdateStory throws on missing session", async () => {
    await expect(adminUpdateStory({ bodyPt: "X" }, null)).rejects.toBeInstanceOf(
      AuthorizationError,
    );
  });

  it("adminUpdateStory persists for an admin session", async () => {
    const out = await adminUpdateStory(
      { bodyPt: "X" },
      { user: { role: "CEREMONIAL" } },
    );
    expect(out.bodyPt).toBe("X");
  });
});

import { assertAdmin, type SessionLike } from "@/lib/server-auth/assert-role";
import { updateSiteSettingsInDb } from "./update";
import type { SiteSettings } from "./get";

/**
 * Admin-side update wrapper: enforces role then defers to the DB layer.
 * Pure (no `revalidatePath`) so it can be unit-tested. The Server Action
 * thin-wraps this and runs the cache invalidation.
 */
export async function adminUpdateSiteSettings(
  input: unknown,
  session: SessionLike | null | undefined,
): Promise<SiteSettings> {
  assertAdmin(session);
  return updateSiteSettingsInDb(input);
}

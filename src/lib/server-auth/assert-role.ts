export const ADMIN_ROLES = ["COUPLE", "CEREMONIAL"] as const;
export type AdminRole = (typeof ADMIN_ROLES)[number];

export class AuthorizationError extends Error {
  constructor(message = "FORBIDDEN") {
    super(message);
    this.name = "AuthorizationError";
  }
}

export interface SessionLike {
  user?: {
    role?: string | null | undefined;
  } | null;
}

export function isAdminRole(value: unknown): value is AdminRole {
  return (
    typeof value === "string" &&
    (ADMIN_ROLES as readonly string[]).includes(value)
  );
}

/**
 * Throws AuthorizationError unless the supplied session has an admin role.
 * Pure function so it can be unit-tested without mocking `auth()`.
 */
export function assertAdmin(session: SessionLike | null | undefined): AdminRole {
  const role = session?.user?.role;
  if (!isAdminRole(role)) {
    throw new AuthorizationError();
  }
  return role;
}

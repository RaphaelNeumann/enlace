import { assertAdmin, type SessionLike } from "./assert-role";

/**
 * Wraps an async function with an admin-role check. The wrapped function
 * receives all of the inner function's args plus a trailing `session`
 * parameter; the session is consumed by `assertAdmin` and not forwarded.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function withAdmin<TArgs extends any[], TResult>(
  inner: (...args: TArgs) => Promise<TResult>,
): (...argsWithSession: [...TArgs, SessionLike | null | undefined]) => Promise<TResult> {
  return async (...argsWithSession) => {
    const session = argsWithSession.pop() as SessionLike | null | undefined;
    assertAdmin(session);
    return inner(...(argsWithSession as unknown as TArgs));
  };
}

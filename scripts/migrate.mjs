// Runs `drizzle-kit migrate` with a hard timeout so a saturated or unreachable
// Supabase pooler can never hang the Vercel build indefinitely.
//
// On ANY failure (timeout OR a fast error such as the pooler being saturated /
// stalling on ClientRead), log a warning and exit 0 so the build continues to
// `next build`. That is safe because every route is `force-dynamic` — the build
// never queries the DB — and migrations are idempotent, so they re-apply on the
// next healthy build. We deliberately do NOT fail the build on a migrate error:
// a transient pooler problem must not be able to block shipping (it created a
// deadlock where a broken deploy kept the pooler degraded, blocking the fix).
import { spawn } from "node:child_process";

const TIMEOUT_MS = 90_000;

const child = spawn("drizzle-kit", ["migrate"], { stdio: "inherit", shell: true });

let timedOut = false;
const timer = setTimeout(() => {
  timedOut = true;
  console.warn(
    `\n⚠️  drizzle-kit migrate exceeded ${TIMEOUT_MS / 1000}s (DB pooler likely ` +
      `saturated/unreachable). Skipping migrations and continuing the build; ` +
      `they will re-apply on the next healthy build.\n`,
  );
  child.kill("SIGKILL");
}, TIMEOUT_MS);

child.on("exit", (code) => {
  clearTimeout(timer);
  if (timedOut || code !== 0) {
    console.warn(
      `\n⚠️  drizzle-kit migrate did not complete cleanly ` +
        `(exitCode=${code}, timedOut=${timedOut}). Continuing the build anyway; ` +
        `migrations will re-apply on the next healthy build.\n`,
    );
  }
  process.exit(0);
});

child.on("error", (err) => {
  clearTimeout(timer);
  console.warn(`⚠️  Could not start drizzle-kit migrate: ${err.message}. Continuing build.`);
  process.exit(0);
});

// Runs `drizzle-kit migrate` with a hard timeout so a saturated or unreachable
// Supabase pooler can never hang the Vercel build indefinitely.
//
// - On timeout: log a warning, kill the child, and exit 0 so the build
//   continues to `next build`. That is safe because every route is
//   `force-dynamic` — the build never queries the DB — and migrations are
//   idempotent, so they re-apply on the next healthy build.
// - On a real migration error (the process exits non-zero on its own, fast):
//   propagate the exit code so a genuine schema problem still fails the build.
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
  process.exit(timedOut ? 0 : (code ?? 0));
});

child.on("error", (err) => {
  clearTimeout(timer);
  console.warn(`⚠️  Could not start drizzle-kit migrate: ${err.message}. Continuing build.`);
  process.exit(0);
});

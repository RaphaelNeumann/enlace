import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set");
}

// Connection settings tuned for serverless (Vercel) behind the Supabase
// transaction pooler (Supavisor, port 6543):
// - prepare: false   — required by transaction-mode pooling (no prepared stmts).
// - max: 1           — each warm function instance holds a single client
//                      connection. With many instances, max: 3 multiplied the
//                      open connections and exhausted Supavisor's client limit,
//                      which makes new queries *queue/hang* (not error) — the
//                      whole site stalled on every DB-backed page.
// - idle_timeout: 20 — close idle connections so they free pooler slots instead
//                      of leaking forever across the serverless fleet.
// - connect_timeout  — fail fast (error) rather than hanging if the pooler is
//                      saturated, so requests surface an error instead of stalling.
// Vitest spawns multiple worker processes; each gets its own client, and max: 1
// per worker is plenty (tests within a worker run serially).
const client = postgres(process.env.DATABASE_URL, {
  prepare: false,
  max: 1,
  idle_timeout: 20,
  connect_timeout: 15,
});

export const db = drizzle(client, { schema });

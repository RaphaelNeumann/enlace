import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set");
}

// Connection settings for serverless (Vercel) behind the Supabase transaction
// pooler (Supavisor, port 6543):
// - prepare: false   — required by transaction-mode pooling (no prepared stmts).
// - max: 10          — MUST be >= the number of queries a single render fires
//                      concurrently. The home does ~8 via Promise.all; with a
//                      tiny pool (max: 1) postgres-js pipelines them all onto one
//                      connection, which Supavisor's transaction mode can't
//                      handle — the backend stalls on `ClientRead` until the 2min
//                      statement_timeout cancels it, timing out the function (504).
//                      The transaction pooler multiplexes server-side, so a larger
//                      client pool is safe (the connection-exhaustion we hit before
//                      was on the *session* pooler / direct connection, not this).
// - idle_timeout: 20 — release idle connections back to the pooler.
// - connect_timeout  — fail fast instead of hanging if the pooler is unreachable.
const client = postgres(process.env.DATABASE_URL, {
  prepare: false,
  max: 10,
  idle_timeout: 20,
  connect_timeout: 15,
});

export const db = drizzle(client, { schema });

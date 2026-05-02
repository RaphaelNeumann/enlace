import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set");
}

// Vitest spawns multiple worker processes; each gets its own client.
// Keep the pool small to avoid exhausting the dev Postgres `max_connections`.
const client = postgres(process.env.DATABASE_URL, { prepare: false, max: 3 });

export const db = drizzle(client, { schema });

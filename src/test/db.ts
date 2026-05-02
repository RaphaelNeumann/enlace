import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { sql } from "drizzle-orm";
import { randomBytes } from "node:crypto";
import * as schema from "@/lib/db/schema";

const ROOT_URL =
  process.env.TEST_DATABASE_URL ??
  process.env.DATABASE_URL ??
  "postgres://enlace:enlace@database:5432/enlace";

export type TestDb = ReturnType<typeof drizzle<typeof schema>> & {
  __schemaName: string;
  __close: () => Promise<void>;
};

export async function createTestDb(): Promise<TestDb> {
  const schemaName = `test_${randomBytes(6).toString("hex")}`;
  const client = postgres(ROOT_URL, {
    prepare: false,
    onnotice: () => {},
  });
  await client.unsafe(`CREATE SCHEMA "${schemaName}"`);
  await client.unsafe(`SET search_path TO "${schemaName}"`);
  const db = drizzle(client, { schema });
  await migrate(db, { migrationsFolder: "./drizzle" }).catch(async () => {
    await db.execute(sql.raw(`SET search_path TO "${schemaName}"`));
  });
  return Object.assign(db, {
    __schemaName: schemaName,
    __close: async () => {
      await client.unsafe(`DROP SCHEMA "${schemaName}" CASCADE`);
      await client.end();
    },
  });
}

import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { programacaoCards } from "@/lib/db/schema";
import { withAdmin } from "@/lib/server-auth/with-admin";
import {
  programacaoCardIdSchema,
  programacaoCardUpdateSchema,
} from "./schema";

export type ProgramacaoCard = typeof programacaoCards.$inferSelect;

const FIXED_IDS = ["ceremony", "reception"] as const;

export async function ensureProgramacaoSeeded(client: typeof db = db): Promise<void> {
  const existing = await client.select({ id: programacaoCards.id }).from(programacaoCards);
  const have = new Set(existing.map((r) => r.id));
  for (const id of FIXED_IDS) {
    if (!have.has(id)) {
      await client.insert(programacaoCards).values({ id });
    }
  }
}

export async function listProgramacao(client: typeof db = db): Promise<ProgramacaoCard[]> {
  await ensureProgramacaoSeeded(client);
  return client.select().from(programacaoCards);
}

export async function getProgramacaoCard(
  rawId: unknown,
  client: typeof db = db,
): Promise<ProgramacaoCard> {
  const id = programacaoCardIdSchema.parse(rawId);
  await ensureProgramacaoSeeded(client);
  const rows = await client
    .select()
    .from(programacaoCards)
    .where(eq(programacaoCards.id, id))
    .limit(1);
  return rows[0];
}

export async function updateProgramacaoCardInDb(
  rawId: unknown,
  input: unknown,
  client: typeof db = db,
): Promise<ProgramacaoCard> {
  const id = programacaoCardIdSchema.parse(rawId);
  const parsed = programacaoCardUpdateSchema.parse(input);
  await ensureProgramacaoSeeded(client);
  const updated = await client
    .update(programacaoCards)
    .set({ ...parsed, updatedAt: new Date() })
    .where(eq(programacaoCards.id, id))
    .returning();
  return updated[0];
}

export const adminUpdateProgramacaoCard = withAdmin(updateProgramacaoCardInDb);

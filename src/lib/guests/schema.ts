import { z } from "zod";

const text = (max: number) => z.string().trim().min(1).max(max);
const observationCap = z.string().trim().max(500).optional().nullable();

export const guestSourceSchema = z.enum(["admin", "submitted"]);
export const rsvpStatusSchema = z.enum(["pending", "confirmed", "declined"]);

export const guestCreateSchema = z.object({
  firstName: text(80),
  lastName: text(80),
  plusOnesAllowed: z.number().int().nonnegative().max(20).default(0),
  source: guestSourceSchema.default("admin"),
});

export const guestUpdateSchema = z.object({
  firstName: text(80).optional(),
  lastName: text(80).optional(),
  plusOnesAllowed: z.number().int().nonnegative().max(20).optional(),
  rsvpStatus: rsvpStatusSchema.optional(),
  observation: observationCap,
});

export const typeaheadInputSchema = z.object({
  prefix: z.string().trim().min(2).max(80),
});

export type GuestCreate = z.infer<typeof guestCreateSchema>;
export type GuestUpdate = z.infer<typeof guestUpdateSchema>;
export type RsvpStatus = z.infer<typeof rsvpStatusSchema>;

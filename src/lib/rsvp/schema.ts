import { z } from "zod";

const name = z.string().trim().min(1).max(80);

export const rsvpSubmitSchema = z.object({
  firstName: name,
  lastName: name,
  attending: z.enum(["yes", "no"]),
  plusOneNames: z.array(name).max(20).default([]),
  observation: z.string().trim().max(500).optional().nullable(),
});

export type RsvpSubmitInput = z.infer<typeof rsvpSubmitSchema>;

import { z } from "zod";

const name = z.string().trim().min(1).max(80);

export const plusOneNameSchema = name;
export const plusOneNamesSchema = z.array(name).max(20);

export type PlusOneNames = z.infer<typeof plusOneNamesSchema>;

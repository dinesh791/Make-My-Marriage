import { z } from "zod";

const email = z.string().trim().toLowerCase().max(254).pipe(z.email());
const password = z.string().min(12, "Use at least 12 characters.").max(128);

export const registerSchema = z
  .object({
    firstName: z.string().trim().min(1, "Enter your name.").max(100),
    lastName: z.string().trim().max(100).optional(),
    email,
    password,
    locale: z.enum(["en", "ta"]).default("en"),
  })
  .strict();

export const loginSchema = z
  .object({
    email,
    password: z.string().min(1).max(128),
    remember: z.boolean().default(false),
  })
  .strict();

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;

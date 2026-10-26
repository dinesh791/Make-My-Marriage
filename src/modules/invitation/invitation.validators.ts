import { z } from "zod";

export const saveInvitationSchema = z
  .object({
    message: z.string().trim().min(1, "Enter an invitation message.").max(1000),
    revision: z
      .number()
      .int()
      .min(0)
      .max(Number.MAX_SAFE_INTEGER - 1),
  })
  .strict();
export const publishInvitationSchema = z
  .object({
    revision: z
      .number()
      .int()
      .min(1)
      .max(Number.MAX_SAFE_INTEGER - 1),
  })
  .strict();
export type SaveInvitationInput = z.infer<typeof saveInvitationSchema>;

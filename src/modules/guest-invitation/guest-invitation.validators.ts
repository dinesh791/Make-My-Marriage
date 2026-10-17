import { z } from "zod";

export const sendGuestInvitationsSchema = z
  .object({
    recipients: z.array(z.email().max(254)).min(1).max(10),
  })
  .strict();

export const guestResponseSchema = z
  .object({
    response: z.enum(["ATTENDING", "DECLINED"]),
  })
  .strict();

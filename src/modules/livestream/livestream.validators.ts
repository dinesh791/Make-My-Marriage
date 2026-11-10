import { z } from "zod";

export const livestreamInputSchema = z.object({
  title: z.string().trim().min(1).max(120),
  playbackUrl: z
    .url()
    .max(2000)
    .refine((value) => {
      try {
        const url = new URL(value);
        return url.protocol === "https:" && !url.username && !url.password;
      } catch {
        return false;
      }
    }, "Enter a secure HTTPS viewing link."),
  enabled: z.boolean(),
});
export type LivestreamInput = z.infer<typeof livestreamInputSchema>;

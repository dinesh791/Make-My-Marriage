import { z } from "zod";

const httpUrl = z
  .string()
  .max(2000)
  .refine((value) => {
    try {
      return ["http:", "https:"].includes(new URL(value).protocol);
    } catch {
      return false;
    }
  }, "Enter an HTTP or HTTPS link.");

const displayName = z.string().trim().max(100);

export const createWeddingSchema = z.object({
  title: z.string().trim().min(3).max(120),
  brideName: displayName.optional(),
  groomName: displayName.optional(),
  role: z.enum(["BRIDE", "GROOM"]),
  story: z.string().trim().max(2000).optional().or(z.literal("")),
  weddingDate: z.iso.datetime({ offset: true }),
  venueName: z.string().trim().min(2).max(160),
  venueAddress: z.string().trim().min(2).max(500),
  mapsUrl: z.union([z.literal(""), httpUrl]).optional(),
});

export type CreateWeddingInput = z.infer<typeof createWeddingSchema>;

export const updateWeddingSchema = createWeddingSchema
  .omit({ role: true })
  .partial()
  .strict()
  .refine((input) => Object.keys(input).length > 0, "Provide at least one wedding detail.");

export type UpdateWeddingInput = z.infer<typeof updateWeddingSchema>;

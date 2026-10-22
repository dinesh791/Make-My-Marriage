import { z } from "zod";

const optionalText = (max: number) => z.string().trim().max(max).nullable();
const optionalUrl = z
  .string()
  .trim()
  .max(2000)
  .refine((value) => {
    try {
      return ["http:", "https:"].includes(new URL(value).protocol);
    } catch {
      return false;
    }
  }, "Enter an HTTP or HTTPS link.")
  .nullable();

export const saveEventSchema = z
  .object({
    startsAt: z.iso.datetime({ offset: true }).nullable(),
    endsAt: z.iso.datetime({ offset: true }).nullable(),
    venueName: optionalText(160),
    address: optionalText(500),
    mapsUrl: optionalUrl,
    description: optionalText(1000),
    enabled: z.boolean(),
  })
  .strict()
  .superRefine((event, context) => {
    if (event.enabled && !event.startsAt)
      context.addIssue({
        code: "custom",
        path: ["startsAt"],
        message: "Add a date and time before publishing.",
      });
    if (event.endsAt && !event.startsAt)
      context.addIssue({ code: "custom", path: ["endsAt"], message: "Add a start time first." });
    if (event.startsAt && event.endsAt && new Date(event.endsAt) <= new Date(event.startsAt))
      context.addIssue({
        code: "custom",
        path: ["endsAt"],
        message: "End time must be after the start time.",
      });
  });

export type SaveEventInput = z.infer<typeof saveEventSchema>;

import { z } from "zod";
const text = (max: number) => z.string().trim().max(max).default("");
export const cateringSchema = z.object({
  foodType: z.enum(["", "VEGETARIAN", "NON_VEGETARIAN", "MIXED"]).default(""),
  breakfast: text(2000),
  lunch: text(2000),
  dinner: text(2000),
  snacks: text(2000),
  notes: text(2000),
  catererName: text(120),
  contactPerson: text(120),
  phone: text(30),
  email: z
    .string()
    .trim()
    .max(254)
    .pipe(z.union([z.literal(""), z.email()]))
    .default(""),
});
export type CateringInput = z.infer<typeof cateringSchema>;

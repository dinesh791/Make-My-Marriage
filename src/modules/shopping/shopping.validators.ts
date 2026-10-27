import { z } from "zod";
import { SHOPPING_CATEGORIES } from "@/models/shopping-item";

export const createShoppingItemSchema = z
  .object({
    title: z.string().trim().min(1).max(120),
    category: z.enum(SHOPPING_CATEGORIES),
  })
  .strict();

export const updateShoppingItemSchema = z
  .object({
    title: z.string().trim().min(1).max(120).optional(),
    category: z.enum(SHOPPING_CATEGORIES).optional(),
    completed: z.boolean().optional(),
  })
  .strict()
  .refine((value) => Object.keys(value).length > 0, "Provide a field to update.");

export type CreateShoppingItemInput = z.infer<typeof createShoppingItemSchema>;
export type UpdateShoppingItemInput = z.infer<typeof updateShoppingItemSchema>;

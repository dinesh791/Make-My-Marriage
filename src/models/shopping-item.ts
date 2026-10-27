import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

export const SHOPPING_CATEGORIES = ["BRIDE", "GROOM", "WEDDING"] as const;
export type ShoppingCategory = (typeof SHOPPING_CATEGORIES)[number];

export const shoppingItemSchema = new Schema(
  {
    weddingId: { type: Schema.Types.ObjectId, required: true, ref: "Wedding" },
    category: { type: String, enum: SHOPPING_CATEGORIES, required: true },
    title: { type: String, required: true, trim: true, maxlength: 120 },
    isDefault: { type: Boolean, required: true, default: false },
    seedKey: { type: String, default: null },
    completed: { type: Boolean, required: true, default: false },
    sortOrder: { type: Number, required: true },
    deletedAt: { type: Date, default: null },
  },
  { collection: "shopping_items", timestamps: true, autoCreate: false, autoIndex: false },
);

shoppingItemSchema.index(
  { weddingId: 1, seedKey: 1 },
  {
    name: "shopping_default_seed_unique",
    unique: true,
    partialFilterExpression: { isDefault: true },
  },
);
shoppingItemSchema.index(
  { weddingId: 1, category: 1, sortOrder: 1 },
  { name: "shopping_wedding_category_order" },
);

export type ShoppingItemRecord = InferSchemaType<typeof shoppingItemSchema>;
export const ShoppingItemModel: Model<ShoppingItemRecord> =
  (mongoose.models.ShoppingItem as Model<ShoppingItemRecord> | undefined) ??
  mongoose.model<ShoppingItemRecord>("ShoppingItem", shoppingItemSchema);

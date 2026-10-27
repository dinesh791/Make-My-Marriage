import type { Types } from "mongoose";
import type { ShoppingItemRecord } from "@/models/shopping-item";

export function toShoppingItemDto(item: ShoppingItemRecord & { _id: Types.ObjectId }) {
  return {
    id: item._id.toString(),
    category: item.category,
    title: item.title,
    isDefault: item.isDefault,
    completed: item.completed,
    sortOrder: item.sortOrder,
  };
}

export type ShoppingItemDto = ReturnType<typeof toShoppingItemDto>;

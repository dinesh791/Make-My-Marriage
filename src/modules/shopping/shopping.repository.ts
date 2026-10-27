import "server-only";
import { ShoppingItemModel, type ShoppingCategory } from "@/models/shopping-item";
import type { CreateShoppingItemInput, UpdateShoppingItemInput } from "./shopping.validators";

let indexesReady: Promise<void> | undefined;

export async function ensureShoppingStorage() {
  indexesReady ??= ShoppingItemModel.collection
    .indexes()
    .then((indexes) => {
      if (!indexes.some((index) => index.name === "shopping_default_seed_unique" && index.unique)) {
        throw new Error("Shopping storage is not provisioned; run npm run db:setup.");
      }
    })
    .catch((error) => {
      indexesReady = undefined;
      throw error;
    });
  await indexesReady;
}

export async function seedDefaults(weddingId: string) {
  const suggestions: Array<[ShoppingCategory, string, string]> = [
    ["BRIDE", "bride-saree", "Wedding saree"],
    ["BRIDE", "bride-jewellery", "Wedding jewellery"],
    ["BRIDE", "bride-footwear", "Wedding footwear"],
    ["BRIDE", "bride-flowers", "Jasmine flowers"],
    ["GROOM", "groom-veshti", "Wedding veshti and shirt"],
    ["GROOM", "groom-reception", "Reception outfit"],
    ["GROOM", "groom-footwear", "Wedding footwear"],
    ["GROOM", "groom-accessories", "Wedding accessories"],
    ["WEDDING", "wedding-garlands", "Wedding garlands"],
    ["WEDDING", "wedding-ceremony", "Ceremony supplies"],
    ["WEDDING", "wedding-gifts", "Return gifts"],
    ["WEDDING", "wedding-lamps", "Brass lamps and wicks"],
  ];
  if (
    (await ShoppingItemModel.countDocuments({ weddingId, isDefault: true })) >= suggestions.length
  )
    return;
  for (const [index, [category, seedKey, title]] of suggestions.entries()) {
    try {
      await ShoppingItemModel.updateOne(
        { weddingId, seedKey, isDefault: true },
        {
          $setOnInsert: {
            weddingId,
            category,
            seedKey,
            title,
            isDefault: true,
            completed: false,
            sortOrder: index % 4,
            deletedAt: null,
          },
        },
        { upsert: true },
      );
    } catch (error) {
      if (!(typeof error === "object" && error !== null && "code" in error && error.code === 11000))
        throw error;
    }
  }
}

export function listForWedding(weddingId: string) {
  return ShoppingItemModel.find({ weddingId, deletedAt: null })
    .sort({ category: 1, sortOrder: 1, _id: 1 })
    .lean();
}

export function findActiveById(itemId: string) {
  return ShoppingItemModel.findOne({ _id: itemId, deletedAt: null }).lean();
}

export async function createForWedding(weddingId: string, input: CreateShoppingItemInput) {
  const last = await ShoppingItemModel.findOne({ weddingId, category: input.category })
    .sort({ sortOrder: -1, _id: -1 })
    .select("sortOrder")
    .lean();
  return ShoppingItemModel.create({
    weddingId,
    ...input,
    isDefault: false,
    completed: false,
    sortOrder: (last?.sortOrder ?? -1) + 1,
    deletedAt: null,
  });
}

export function updateById(itemId: string, input: UpdateShoppingItemInput) {
  return ShoppingItemModel.findOneAndUpdate(
    { _id: itemId, deletedAt: null },
    { $set: input },
    { new: true, runValidators: true },
  );
}

export function deleteById(itemId: string) {
  return ShoppingItemModel.findOneAndUpdate(
    { _id: itemId, deletedAt: null },
    { $set: { deletedAt: new Date() } },
    { new: true },
  );
}

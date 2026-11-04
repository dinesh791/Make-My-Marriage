import "server-only";
import { CateringModel } from "@/models/catering";
import type { CateringInput } from "./catering.validators";
export async function ensureStorage() {
  const indexes = await CateringModel.collection.indexes();
  if (!indexes.some((i) => i.name === "catering_active_wedding_unique" && i.unique))
    throw new Error("Run database setup for catering.");
}
export const find = (weddingId: string) =>
  CateringModel.findOne({ weddingId, deletedAt: null }).lean();
export async function save(weddingId: string, input: CateringInput) {
  try {
    return await CateringModel.findOneAndUpdate(
      { weddingId, deletedAt: null },
      { $set: input },
      { upsert: true, new: true, runValidators: true },
    ).lean();
  } catch (error) {
    if (!(typeof error === "object" && error && "code" in error && error.code === 11000))
      throw error;
    return CateringModel.findOneAndUpdate(
      { weddingId, deletedAt: null },
      { $set: input },
      { new: true, runValidators: true },
    ).lean();
  }
}
export const remove = (weddingId: string) =>
  CateringModel.updateOne({ weddingId, deletedAt: null }, { $set: { deletedAt: new Date() } });

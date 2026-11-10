import "server-only";
import { LivestreamModel } from "@/models/livestream";
import type { LivestreamInput } from "./livestream.validators";

export async function ensureStorage() {
  const indexes = await LivestreamModel.collection.indexes();
  if (!indexes.some((index) => index.name === "livestream_active_wedding_unique" && index.unique))
    throw new Error("Run database setup for livestreams.");
}
export const find = (weddingId: string) =>
  LivestreamModel.findOne({ weddingId, deletedAt: null }).lean();
export async function save(weddingId: string, input: LivestreamInput) {
  try {
    return await LivestreamModel.findOneAndUpdate(
      { weddingId, deletedAt: null },
      { $set: input },
      { upsert: true, new: true, runValidators: true },
    ).lean();
  } catch (error) {
    if (!(typeof error === "object" && error && "code" in error && error.code === 11000))
      throw error;
    return LivestreamModel.findOneAndUpdate(
      { weddingId, deletedAt: null },
      { $set: input },
      { new: true, runValidators: true },
    ).lean();
  }
}
export const remove = (weddingId: string) =>
  LivestreamModel.updateOne({ weddingId, deletedAt: null }, { $set: { deletedAt: new Date() } });

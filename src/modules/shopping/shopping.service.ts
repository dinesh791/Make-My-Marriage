import "server-only";
import { connectToDatabase } from "@/lib/db/mongoose";
import { AppError } from "@/lib/http/errors";
import { getWeddingForMember } from "@/modules/wedding/wedding.service";
import { toShoppingItemDto } from "./shopping.dto";
import * as repository from "./shopping.repository";
import type { CreateShoppingItemInput, UpdateShoppingItemInput } from "./shopping.validators";

export async function listMemberShoppingItems(weddingId: string, userId: string) {
  await getWeddingForMember(weddingId, userId);
  await repository.ensureShoppingStorage();
  await repository.seedDefaults(weddingId);
  return (await repository.listForWedding(weddingId)).map(toShoppingItemDto);
}

export async function createMemberShoppingItem(
  weddingId: string,
  userId: string,
  input: CreateShoppingItemInput,
) {
  await getWeddingForMember(weddingId, userId);
  await repository.ensureShoppingStorage();
  const item = await repository.createForWedding(weddingId, input);
  return toShoppingItemDto(item);
}

async function requireItemForMember(itemId: string, userId: string) {
  if (!/^[0-9a-f]{24}$/i.test(itemId))
    throw new AppError("SHOPPING_ITEM_NOT_FOUND", "Shopping item not found.", 404);
  await connectToDatabase();
  const item = await repository.findActiveById(itemId);
  if (!item) throw new AppError("SHOPPING_ITEM_NOT_FOUND", "Shopping item not found.", 404);
  await getWeddingForMember(String(item.weddingId), userId);
  await repository.ensureShoppingStorage();
  return item;
}

export async function updateMemberShoppingItem(
  itemId: string,
  userId: string,
  input: UpdateShoppingItemInput,
) {
  await requireItemForMember(itemId, userId);
  const item = await repository.updateById(itemId, input);
  if (!item) throw new AppError("SHOPPING_ITEM_NOT_FOUND", "Shopping item not found.", 404);
  return toShoppingItemDto(item);
}

export async function deleteMemberShoppingItem(itemId: string, userId: string) {
  await requireItemForMember(itemId, userId);
  const item = await repository.deleteById(itemId);
  if (!item) throw new AppError("SHOPPING_ITEM_NOT_FOUND", "Shopping item not found.", 404);
}

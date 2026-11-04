import "server-only";
import { getWeddingForMember } from "@/modules/wedding/wedding.service";
import { cateringSchema, type CateringInput } from "./catering.validators";
import * as repository from "./catering.repository";
async function ready(weddingId: string, userId: string) {
  await getWeddingForMember(weddingId, userId);
  await repository.ensureStorage();
}
export async function getCatering(weddingId: string, userId: string) {
  await ready(weddingId, userId);
  const record = await repository.find(weddingId);
  return record ? cateringSchema.parse(record) : null;
}
export async function saveCatering(weddingId: string, userId: string, input: CateringInput) {
  await ready(weddingId, userId);
  return cateringSchema.parse(await repository.save(weddingId, input));
}
export async function deleteCatering(weddingId: string, userId: string) {
  await ready(weddingId, userId);
  await repository.remove(weddingId);
}

import "server-only";
import { connectToDatabase } from "@/lib/db/mongoose";
import { getWeddingForMember } from "@/modules/wedding/wedding.service";
import { livestreamInputSchema, type LivestreamInput } from "./livestream.validators";
import * as repository from "./livestream.repository";

async function memberReady(weddingId: string, userId: string) {
  await getWeddingForMember(weddingId, userId);
  await repository.ensureStorage();
}
export async function getLivestream(weddingId: string, userId: string) {
  await memberReady(weddingId, userId);
  const record = await repository.find(weddingId);
  return record ? livestreamInputSchema.parse(record) : null;
}
export async function saveLivestream(weddingId: string, userId: string, input: LivestreamInput) {
  await memberReady(weddingId, userId);
  return livestreamInputSchema.parse(await repository.save(weddingId, input));
}
export async function deleteLivestream(weddingId: string, userId: string) {
  await memberReady(weddingId, userId);
  await repository.remove(weddingId);
}
export async function getEnabledLivestream(weddingId: string) {
  await connectToDatabase();
  await repository.ensureStorage();
  const record = await repository.find(weddingId);
  return record?.enabled ? { title: record.title, playbackUrl: record.playbackUrl } : null;
}

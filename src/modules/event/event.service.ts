import "server-only";
import { EVENT_TYPES, type EventType } from "@/models/event";
import { AppError } from "@/lib/http/errors";
import { getWeddingForMember } from "@/modules/wedding/wedding.service";
import { emptyEventDto, toEventDto } from "./event.dto";
import * as repository from "./event.repository";
import type { SaveEventInput } from "./event.validators";

export function parseEventType(value: string): EventType {
  if (!EVENT_TYPES.includes(value as EventType))
    throw new AppError("EVENT_NOT_FOUND", "Event not found.", 404);
  return value as EventType;
}

export async function listMemberEvents(weddingId: string, userId: string) {
  await getWeddingForMember(weddingId, userId);
  await repository.ensureEventStorage();
  const records = await repository.listForWedding(weddingId);
  const byType = new Map(records.map((record) => [record.type, toEventDto(record)]));
  return EVENT_TYPES.map((type) => byType.get(type) ?? emptyEventDto(type));
}

export async function saveMemberEvent(
  weddingId: string,
  userId: string,
  type: EventType,
  input: SaveEventInput,
) {
  await getWeddingForMember(weddingId, userId);
  await repository.ensureEventStorage();
  const record = await repository.saveForWedding(weddingId, type, input);
  if (!record) throw new AppError("EVENT_SAVE_FAILED", "Unable to save event.", 503);
  return toEventDto(record);
}

export async function listPublishedEvents(weddingId: string) {
  await repository.ensureEventStorage();
  const records = await repository.listPublishedForWedding(weddingId);
  return records.map(toEventDto);
}

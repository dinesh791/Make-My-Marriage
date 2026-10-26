import "server-only";
import { randomUUID } from "node:crypto";
import { EVENT_TYPES, type EventType, type PredefinedEventType } from "@/models/event";
import { AppError } from "@/lib/http/errors";
import { getWeddingForMember } from "@/modules/wedding/wedding.service";
import { emptyEventDto, toEventDto } from "./event.dto";
import * as repository from "./event.repository";
import type { SaveCustomEventInput, SaveEventInput } from "./event.validators";

export function parseEventType(value: string): PredefinedEventType {
  if (!EVENT_TYPES.includes(value as PredefinedEventType))
    throw new AppError("EVENT_NOT_FOUND", "Event not found.", 404);
  return value as PredefinedEventType;
}

export async function listMemberEvents(weddingId: string, userId: string) {
  await getWeddingForMember(weddingId, userId);
  await repository.ensureEventStorage();
  const records = await repository.listForWedding(weddingId);
  const active = records.filter((record) => !record.deletedAt);
  const byType = new Map(active.map((record) => [record.type, toEventDto(record)]));
  const deletedTypes = new Set(
    records.filter((record) => record.deletedAt).map((record) => record.type),
  );
  const predefined = EVENT_TYPES.filter((type) => byType.has(type) || !deletedTypes.has(type)).map(
    (type) => byType.get(type) ?? emptyEventDto(type),
  );
  const custom = active
    .filter((record) => !EVENT_TYPES.includes(record.type as (typeof EVENT_TYPES)[number]))
    .map(toEventDto);
  return [...predefined, ...custom];
}

export async function createMemberCustomEvent(
  weddingId: string,
  userId: string,
  input: SaveCustomEventInput,
) {
  await getWeddingForMember(weddingId, userId);
  await repository.ensureEventStorage();
  const event = await repository.createCustomForWedding(
    weddingId,
    `CUSTOM_${randomUUID()}` as EventType,
    input,
  );
  return toEventDto(event);
}

export async function saveMemberCustomEvent(
  weddingId: string,
  userId: string,
  eventId: string,
  input: SaveCustomEventInput,
) {
  await getWeddingForMember(weddingId, userId);
  if (!/^[0-9a-f]{24}$/i.test(eventId))
    throw new AppError("EVENT_NOT_FOUND", "Custom event not found.", 404);
  await repository.ensureEventStorage();
  const event = await repository.saveCustomForWedding(weddingId, eventId, input);
  if (!event) throw new AppError("EVENT_NOT_FOUND", "Custom event not found.", 404);
  return toEventDto(event);
}

export async function deleteMemberCustomEvent(weddingId: string, userId: string, eventId: string) {
  await getWeddingForMember(weddingId, userId);
  if (!/^[0-9a-f]{24}$/i.test(eventId))
    throw new AppError("EVENT_NOT_FOUND", "Custom event not found.", 404);
  await repository.ensureEventStorage();
  const event = await repository.deleteCustomForWedding(weddingId, eventId);
  if (!event) throw new AppError("EVENT_NOT_FOUND", "Custom event not found.", 404);
}

export async function deleteMemberPredefinedEvent(
  weddingId: string,
  userId: string,
  type: PredefinedEventType,
) {
  await getWeddingForMember(weddingId, userId);
  await repository.ensureEventStorage();
  const event = await repository.deletePredefinedForWedding(weddingId, type);
  if (!event) throw new AppError("EVENT_DELETE_FAILED", "Unable to delete event.", 503);
}

export async function saveMemberEvent(
  weddingId: string,
  userId: string,
  type: PredefinedEventType,
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

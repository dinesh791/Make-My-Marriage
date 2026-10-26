import "server-only";
import { EventModel, type EventType, type PredefinedEventType } from "@/models/event";
import type { SaveCustomEventInput, SaveEventInput } from "./event.validators";
import { eventOrder, eventTitle } from "./event.dto";

let indexesReady: Promise<void> | undefined;

export async function ensureEventStorage() {
  indexesReady ??= EventModel.collection
    .indexes()
    .then((indexes) => {
      if (
        !indexes.some(
          (index) =>
            index.name === "events_wedding_type_active_unique" &&
            index.unique &&
            index.key.weddingId === 1 &&
            index.key.type === 1 &&
            Object.keys(index.key).length === 2 &&
            index.partialFilterExpression?.deletedAt === null,
        )
      ) {
        throw new Error("Event storage is not provisioned; run npm run db:setup.");
      }
    })
    .catch((error) => {
      indexesReady = undefined;
      throw error;
    });
  await indexesReady;
}

export function listForWedding(weddingId: string) {
  return EventModel.find({ weddingId }).sort({ sortOrder: 1, _id: 1 }).lean();
}

export function listPublishedForWedding(weddingId: string) {
  return EventModel.find({ weddingId, deletedAt: null, enabled: true, startsAt: { $ne: null } })
    .sort({ sortOrder: 1, _id: 1 })
    .lean();
}

export function saveForWedding(
  weddingId: string,
  type: PredefinedEventType,
  input: SaveEventInput,
) {
  return EventModel.findOneAndUpdate(
    { weddingId, type, deletedAt: null },
    {
      $set: {
        startsAt: input.startsAt ? new Date(input.startsAt) : null,
        endsAt: input.endsAt ? new Date(input.endsAt) : null,
        venueName: input.venueName || null,
        address: input.address || null,
        mapsUrl: input.mapsUrl || null,
        description: input.description || null,
        enabled: input.enabled,
      },
      $setOnInsert: {
        weddingId,
        type,
        title: eventTitle(type),
        timezone: "Asia/Kolkata",
        sortOrder: eventOrder(type),
        deletedAt: null,
      },
    },
    { upsert: true, new: true, runValidators: true },
  );
}

export async function createCustomForWedding(
  weddingId: string,
  type: EventType,
  input: SaveCustomEventInput,
) {
  const lastEvent = await EventModel.findOne({ weddingId })
    .sort({ sortOrder: -1, _id: -1 })
    .select("sortOrder")
    .lean();
  const sortOrder = Math.max(4, (lastEvent?.sortOrder ?? 3) + 1);
  return EventModel.create({
    weddingId,
    type,
    title: input.title,
    startsAt: input.startsAt ? new Date(input.startsAt) : null,
    endsAt: input.endsAt ? new Date(input.endsAt) : null,
    timezone: "Asia/Kolkata",
    venueName: input.venueName || null,
    address: input.address || null,
    mapsUrl: input.mapsUrl || null,
    description: input.description || null,
    enabled: input.enabled,
    sortOrder,
    deletedAt: null,
  });
}

export function saveCustomForWedding(
  weddingId: string,
  eventId: string,
  input: SaveCustomEventInput,
) {
  return EventModel.findOneAndUpdate(
    { _id: eventId, weddingId, type: /^CUSTOM_/, deletedAt: null },
    {
      $set: {
        title: input.title,
        startsAt: input.startsAt ? new Date(input.startsAt) : null,
        endsAt: input.endsAt ? new Date(input.endsAt) : null,
        venueName: input.venueName || null,
        address: input.address || null,
        mapsUrl: input.mapsUrl || null,
        description: input.description || null,
        enabled: input.enabled,
      },
    },
    { new: true, runValidators: true },
  );
}

export function deleteCustomForWedding(weddingId: string, eventId: string) {
  return EventModel.findOneAndUpdate(
    { _id: eventId, weddingId, type: /^CUSTOM_/, deletedAt: null },
    { $set: { enabled: false, deletedAt: new Date() } },
    { new: true },
  );
}

export function deletePredefinedForWedding(weddingId: string, type: PredefinedEventType) {
  return EventModel.findOneAndUpdate(
    { weddingId, type },
    {
      $set: { enabled: false, deletedAt: new Date() },
      $setOnInsert: {
        weddingId,
        type,
        title: eventTitle(type),
        timezone: "Asia/Kolkata",
        sortOrder: eventOrder(type),
      },
    },
    { upsert: true, new: true, runValidators: true, sort: { deletedAt: 1, _id: 1 } },
  );
}

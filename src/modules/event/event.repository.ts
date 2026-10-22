import "server-only";
import { EventModel, type EventType } from "@/models/event";
import type { SaveEventInput } from "./event.validators";
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
  return EventModel.find({ weddingId, deletedAt: null }).sort({ sortOrder: 1 }).lean();
}

export function listPublishedForWedding(weddingId: string) {
  return EventModel.find({ weddingId, deletedAt: null, enabled: true, startsAt: { $ne: null } })
    .sort({ sortOrder: 1 })
    .lean();
}

export function saveForWedding(weddingId: string, type: EventType, input: SaveEventInput) {
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

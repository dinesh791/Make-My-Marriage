import type { Types } from "mongoose";
import {
  EVENT_TYPES,
  type EventRecord,
  type EventType,
  type PredefinedEventType,
} from "@/models/event";

const titles: Record<PredefinedEventType, string> = {
  ENGAGEMENT: "Engagement",
  NALANGU: "Nalangu",
  MUHURTHAM: "Muhurtham",
  RECEPTION: "Reception",
};

export function eventTitle(type: PredefinedEventType) {
  return titles[type];
}

export function eventOrder(type: EventType) {
  const order = EVENT_TYPES.indexOf(type as (typeof EVENT_TYPES)[number]);
  return order === -1 ? Number.MAX_SAFE_INTEGER : order;
}

export function toEventDto(event: EventRecord & { _id: Types.ObjectId }) {
  return {
    id: event._id.toString(),
    type: event.type as EventType,
    title: event.title,
    startsAt: event.startsAt?.toISOString() ?? null,
    endsAt: event.endsAt?.toISOString() ?? null,
    timezone: event.timezone,
    venueName: event.venueName ?? null,
    address: event.address ?? null,
    mapsUrl: event.mapsUrl ?? null,
    description: event.description ?? null,
    enabled: event.enabled,
    sortOrder: event.sortOrder,
  };
}

export type EventDto = ReturnType<typeof toEventDto>;

export function emptyEventDto(type: PredefinedEventType): EventDto {
  return {
    id: "",
    type,
    title: eventTitle(type),
    startsAt: null,
    endsAt: null,
    timezone: "Asia/Kolkata",
    venueName: null,
    address: null,
    mapsUrl: null,
    description: null,
    enabled: false,
    sortOrder: eventOrder(type),
  };
}

import type { Types } from "mongoose";
import type { WeddingRecord } from "@/models/wedding";

export function toWeddingDto(wedding: WeddingRecord & { _id: Types.ObjectId }) {
  return {
    id: wedding._id.toString(),
    slug: wedding.slug,
    title: wedding.title,
    story: wedding.story,
    weddingDate: wedding.weddingDate.toISOString(),
    timezone: wedding.timezone,
    venueName: wedding.venueName,
    venueAddress: wedding.venueAddress,
    mapsUrl: wedding.mapsUrl,
    description: wedding.description,
    status: wedding.status,
  };
}

export type WeddingDto = ReturnType<typeof toWeddingDto>;

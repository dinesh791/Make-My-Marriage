import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

export const EVENT_TYPES = ["ENGAGEMENT", "NALANGU", "MUHURTHAM", "RECEPTION"] as const;
export type EventType = (typeof EVENT_TYPES)[number];

export const eventSchema = new Schema(
  {
    weddingId: { type: Schema.Types.ObjectId, required: true, ref: "Wedding" },
    type: { type: String, enum: EVENT_TYPES, required: true },
    title: { type: String, required: true, trim: true, maxlength: 120 },
    startsAt: { type: Date, default: null },
    endsAt: { type: Date, default: null },
    timezone: { type: String, required: true, default: "Asia/Kolkata" },
    venueName: { type: String, default: null, trim: true, maxlength: 160 },
    address: { type: String, default: null, trim: true, maxlength: 500 },
    mapsUrl: { type: String, default: null, trim: true, maxlength: 2000 },
    description: { type: String, default: null, trim: true, maxlength: 1000 },
    enabled: { type: Boolean, required: true, default: false },
    sortOrder: { type: Number, required: true },
    deletedAt: { type: Date, default: null },
  },
  { collection: "events", timestamps: true, autoCreate: false, autoIndex: false },
);

eventSchema.index(
  { weddingId: 1, type: 1 },
  {
    unique: true,
    name: "events_wedding_type_active_unique",
    partialFilterExpression: { deletedAt: null },
  },
);
eventSchema.index({ weddingId: 1, enabled: 1, sortOrder: 1 }, { name: "events_public_order" });

export type EventRecord = InferSchemaType<typeof eventSchema>;
export const EventModel: Model<EventRecord> =
  (mongoose.models.Event as Model<EventRecord> | undefined) ??
  mongoose.model<EventRecord>("Event", eventSchema);

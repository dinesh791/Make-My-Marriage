import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

export const weddingSchema = new Schema(
  {
    slug: { type: String, required: true, lowercase: true, trim: true, maxlength: 100 },
    title: { type: String, required: true, trim: true, maxlength: 120 },
    brideName: { type: String, default: null, trim: true, maxlength: 100 },
    groomName: { type: String, default: null, trim: true, maxlength: 100 },
    story: { type: String, default: null, trim: true, maxlength: 2000 },
    weddingDate: { type: Date, required: true },
    timezone: { type: String, required: true, default: "Asia/Kolkata" },
    venueName: { type: String, required: true, trim: true, maxlength: 160 },
    venueAddress: { type: String, required: true, trim: true, maxlength: 500 },
    mapsUrl: { type: String, default: null, trim: true, maxlength: 2000 },
    coverPhotoKey: { type: String, default: null },
    description: { type: String, default: null, trim: true, maxlength: 1000 },
    status: { type: String, enum: ["ACTIVE", "ARCHIVED"], default: "ACTIVE", required: true },
    deletedAt: { type: Date, default: null },
  },
  { collection: "weddings", timestamps: true, autoCreate: false, autoIndex: false },
);

weddingSchema.index({ slug: 1 }, { unique: true, name: "weddings_slug_unique" });
weddingSchema.index({ status: 1, deletedAt: 1 }, { name: "weddings_status_deleted" });

export type WeddingRecord = InferSchemaType<typeof weddingSchema>;
export const WeddingModel: Model<WeddingRecord> =
  (mongoose.models.Wedding as Model<WeddingRecord> | undefined) ??
  mongoose.model<WeddingRecord>("Wedding", weddingSchema);

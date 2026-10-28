import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

export const galleryAlbumSchema = new Schema(
  {
    weddingId: { type: Schema.Types.ObjectId, ref: "Wedding", required: true },
    name: { type: String, required: true, trim: true, maxlength: 80 },
    seedKey: { type: String, default: null },
    sortOrder: { type: Number, required: true, default: 0 },
    deletedAt: { type: Date, default: null },
  },
  { collection: "albums", timestamps: true, autoCreate: false, autoIndex: false },
);

galleryAlbumSchema.index({ weddingId: 1, sortOrder: 1 }, { name: "albums_wedding_order" });
galleryAlbumSchema.index(
  { weddingId: 1, seedKey: 1 },
  {
    name: "albums_seed_unique",
    unique: true,
    partialFilterExpression: { seedKey: { $type: "string" } },
  },
);

export type GalleryAlbumRecord = InferSchemaType<typeof galleryAlbumSchema>;
export const GalleryAlbumModel: Model<GalleryAlbumRecord> =
  (mongoose.models.GalleryAlbum as Model<GalleryAlbumRecord> | undefined) ??
  mongoose.model<GalleryAlbumRecord>("GalleryAlbum", galleryAlbumSchema);

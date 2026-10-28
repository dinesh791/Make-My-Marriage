import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

export const galleryPhotoSchema = new Schema(
  {
    weddingId: { type: Schema.Types.ObjectId, ref: "Wedding", required: true },
    albumId: { type: Schema.Types.ObjectId, ref: "GalleryAlbum", required: true },
    objectKey: { type: String, required: true },
    originalName: { type: String, required: true, maxlength: 180 },
    caption: { type: String, required: true, default: "", maxlength: 240 },
    mimeType: { type: String, required: true },
    sizeBytes: { type: Number, required: true },
    uploadedByType: { type: String, enum: ["USER", "GUEST"], required: true, default: "USER" },
    uploadedByUserId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    status: { type: String, enum: ["PENDING", "DRAFT", "PUBLISHED"], required: true },
    uploadExpiresAt: { type: Date, default: null },
    publishedAt: { type: Date, default: null },
    deletedAt: { type: Date, default: null },
  },
  { collection: "photos", timestamps: true, autoCreate: false, autoIndex: false },
);

galleryPhotoSchema.index(
  { weddingId: 1, status: 1, createdAt: -1 },
  { name: "photos_wedding_status_created" },
);
galleryPhotoSchema.index(
  { albumId: 1, status: 1, createdAt: -1 },
  { name: "photos_album_status_created" },
);
galleryPhotoSchema.index({ objectKey: 1 }, { name: "photos_object_key_unique", unique: true });

export type GalleryPhotoRecord = InferSchemaType<typeof galleryPhotoSchema>;
export const GalleryPhotoModel: Model<GalleryPhotoRecord> =
  (mongoose.models.GalleryPhoto as Model<GalleryPhotoRecord> | undefined) ??
  mongoose.model<GalleryPhotoRecord>("GalleryPhoto", galleryPhotoSchema);

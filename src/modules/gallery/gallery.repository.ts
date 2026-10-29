import "server-only";
import { GalleryAlbumModel } from "@/models/gallery-album";
import { GalleryPhotoModel } from "@/models/gallery-photo";

let ready: Promise<void> | undefined;
export async function ensureGalleryStorage() {
  ready ??= Promise.all([
    GalleryAlbumModel.collection.indexes(),
    GalleryPhotoModel.collection.indexes(),
  ])
    .then(([albums, photos]) => {
      if (
        !albums.some((index) => index.name === "albums_seed_unique" && index.unique) ||
        !photos.some((index) => index.name === "photos_object_key_unique" && index.unique)
      ) {
        throw new Error("Gallery storage is not provisioned; run npm run db:setup.");
      }
    })
    .catch((error) => {
      ready = undefined;
      throw error;
    });
  await ready;
}

export async function seedAlbums(weddingId: string) {
  const defaults = ["Engagement", "Nalangu", "Muhurtham", "Reception", "Family & Friends"];
  for (const [sortOrder, name] of defaults.entries()) {
    const seedKey = name.toLowerCase().replace(/[^a-z]+/g, "-");
    try {
      await GalleryAlbumModel.updateOne(
        { weddingId, seedKey },
        { $setOnInsert: { weddingId, seedKey, name, sortOrder, deletedAt: null } },
        { upsert: true },
      );
    } catch (error) {
      if (!(typeof error === "object" && error !== null && "code" in error && error.code === 11000))
        throw error;
    }
  }
}

export const listAlbums = (weddingId: string) =>
  GalleryAlbumModel.find({ weddingId, deletedAt: null }).sort({ sortOrder: 1, _id: 1 }).lean();
export const findAlbum = (weddingId: string, albumId: string) =>
  GalleryAlbumModel.findOne({ _id: albumId, weddingId, deletedAt: null }).lean();
export const findPhoto = (photoId: string) =>
  GalleryPhotoModel.findOne({ _id: photoId, deletedAt: null }).lean();
export const listPhotos = (weddingId: string, publishedOnly = false) =>
  GalleryPhotoModel.find({
    weddingId,
    deletedAt: null,
    status: publishedOnly ? "PUBLISHED" : { $in: ["DRAFT", "PUBLISHED"] },
  })
    .sort({ createdAt: -1, _id: -1 })
    .lean();

export const countAlbums = (weddingId: string) =>
  GalleryAlbumModel.countDocuments({ weddingId, deletedAt: null });
export const createAlbumRecord = (weddingId: string, name: string, sortOrder: number) =>
  GalleryAlbumModel.create({ weddingId, name, sortOrder, deletedAt: null });
export const findActiveAlbumById = (albumId: string) =>
  GalleryAlbumModel.findOne({ _id: albumId, deletedAt: null }).lean();
export const renameAlbumRecord = (albumId: string, name: string) =>
  GalleryAlbumModel.findOneAndUpdate(
    { _id: albumId, deletedAt: null },
    { $set: { name } },
    { new: true },
  ).lean();
export const albumHasPhotos = (albumId: string) =>
  GalleryPhotoModel.exists({
    albumId,
    deletedAt: null,
    $or: [
      { status: { $in: ["DRAFT", "PUBLISHED"] } },
      { status: "PENDING", uploadExpiresAt: { $gt: new Date() } },
    ],
  });
export const deleteAlbumRecord = (albumId: string) =>
  GalleryAlbumModel.updateOne(
    { _id: albumId, deletedAt: null },
    { $set: { deletedAt: new Date() } },
  );

export const createPendingPhoto = (input: {
  weddingId: string;
  albumId: string;
  objectKey: string;
  originalName: string;
  caption: string;
  mimeType: string;
  sizeBytes: number;
  uploadedByType: "USER" | "GUEST";
  uploadedByUserId?: string;
  uploadedByGuestInvitationId?: string;
  uploadExpiresAt: Date;
}) => GalleryPhotoModel.create({ ...input, status: "PENDING" });
export type UploadActor = { type: "USER" | "GUEST"; id: string };
const actorFilter = (
  actor: UploadActor,
):
  | { uploadedByType: "USER"; uploadedByUserId: string }
  | {
      uploadedByType: "GUEST";
      uploadedByGuestInvitationId: string;
    } =>
  actor.type === "USER"
    ? { uploadedByType: "USER", uploadedByUserId: actor.id }
    : { uploadedByType: "GUEST", uploadedByGuestInvitationId: actor.id };
export const findPendingPhoto = (photoId: string, weddingId: string, actor: UploadActor) =>
  GalleryPhotoModel.findOne({
    _id: photoId,
    weddingId,
    ...actorFilter(actor),
    deletedAt: null,
    status: "PENDING",
  }).lean();
export const finalizePendingPhoto = (photoId: string, objectKey: string, actor: UploadActor) =>
  GalleryPhotoModel.findOneAndUpdate(
    { _id: photoId, status: "PENDING", deletedAt: null, ...actorFilter(actor) },
    { $set: { objectKey, status: "DRAFT", uploadExpiresAt: null } },
    { new: true },
  ).lean();
export const findEditablePhoto = (photoId: string) =>
  GalleryPhotoModel.findOne({
    _id: photoId,
    deletedAt: null,
    status: { $in: ["DRAFT", "PUBLISHED"] },
  }).lean();
export const updatePhotoRecord = (
  photoId: string,
  changes: {
    caption?: string;
    albumId?: string;
    status?: "DRAFT" | "PUBLISHED";
    publishedAt?: Date | null;
  },
) =>
  GalleryPhotoModel.findOneAndUpdate(
    { _id: photoId, deletedAt: null, status: { $in: ["DRAFT", "PUBLISHED"] } },
    { $set: changes },
    { new: true },
  ).lean();
export const deletePhotoRecord = (photoId: string) =>
  GalleryPhotoModel.updateOne(
    { _id: photoId, deletedAt: null },
    { $set: { deletedAt: new Date() } },
  );

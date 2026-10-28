import "server-only";
import { randomUUID } from "node:crypto";
import {
  CopyObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import type { Types } from "mongoose";
import { connectToDatabase } from "@/lib/db/mongoose";
import { getR2BucketName, getR2Client } from "@/lib/r2/client";
import { AppError } from "@/lib/http/errors";
import { enforceAuthLimit } from "@/modules/auth/auth.service";
import { getWeddingForMember } from "@/modules/wedding/wedding.service";
import * as repo from "./gallery.repository";
import type { UploadInitInput, UpdatePhotoInput } from "./gallery.validators";

const isId = (value: string) => /^[0-9a-f]{24}$/i.test(value);
const albumMissing = () => new AppError("ALBUM_NOT_FOUND", "Album not found.", 404);
const photoMissing = () => new AppError("PHOTO_NOT_FOUND", "Photo not found.", 404);

function storage() {
  try {
    return { client: getR2Client(), bucket: getR2BucketName() };
  } catch {
    throw new AppError("GALLERY_STORAGE_UNAVAILABLE", "Photo storage is not configured yet.", 503);
  }
}

const albumDto = (album: { _id: Types.ObjectId; name: string; sortOrder: number }) => ({
  id: String(album._id),
  name: album.name,
  sortOrder: album.sortOrder,
});
const photoDto = (photo: {
  _id: Types.ObjectId;
  albumId: Types.ObjectId;
  caption: string;
  originalName: string;
  status: string;
  sizeBytes: number;
  createdAt?: Date;
}) => ({
  id: String(photo._id),
  albumId: String(photo.albumId),
  caption: photo.caption,
  originalName: photo.originalName,
  published: photo.status === "PUBLISHED",
  sizeBytes: photo.sizeBytes,
  createdAt: photo.createdAt?.toISOString() ?? null,
  imageUrl: `/api/v1/photos/${photo._id}/file`,
});

async function memberReady(weddingId: string, userId: string) {
  await getWeddingForMember(weddingId, userId);
  await repo.ensureGalleryStorage();
}

export async function memberGallery(weddingId: string, userId: string) {
  await memberReady(weddingId, userId);
  await repo.seedAlbums(weddingId);
  const [albums, photos] = await Promise.all([
    repo.listAlbums(weddingId),
    repo.listPhotos(weddingId),
  ]);
  return { albums: albums.map(albumDto), photos: photos.map(photoDto) };
}

export async function publishedGallery(weddingId: string) {
  await repo.ensureGalleryStorage();
  const [albums, photos] = await Promise.all([
    repo.listAlbums(weddingId),
    repo.listPhotos(weddingId, true),
  ]);
  const used = new Set(photos.map((photo) => String(photo.albumId)));
  return {
    albums: albums.filter((album) => used.has(String(album._id))).map(albumDto),
    photos: photos.map(photoDto),
  };
}

export async function createAlbum(weddingId: string, userId: string, name: string) {
  await memberReady(weddingId, userId);
  await repo.seedAlbums(weddingId);
  const count = await repo.countAlbums(weddingId);
  if (count >= 30)
    throw new AppError("ALBUM_LIMIT", "This wedding has reached its album limit.", 409);
  const album = await repo.createAlbumRecord(weddingId, name, count);
  return albumDto(album);
}

export async function updateAlbum(albumId: string, userId: string, name: string) {
  if (!isId(albumId)) throw albumMissing();
  const album = await repo.findActiveAlbumById(albumId);
  if (!album) throw albumMissing();
  await memberReady(String(album.weddingId), userId);
  const updated = await repo.renameAlbumRecord(albumId, name);
  if (!updated) throw albumMissing();
  return albumDto(updated);
}

export async function deleteAlbum(albumId: string, userId: string) {
  if (!isId(albumId)) throw albumMissing();
  const album = await repo.findActiveAlbumById(albumId);
  if (!album) throw albumMissing();
  await memberReady(String(album.weddingId), userId);
  if (await repo.albumHasPhotos(albumId))
    throw new AppError("ALBUM_NOT_EMPTY", "Move or remove this album's photos first.", 409);
  await repo.deleteAlbumRecord(albumId);
}

export async function startUpload(weddingId: string, userId: string, input: UploadInitInput) {
  await memberReady(weddingId, userId);
  if (!isId(input.albumId) || !(await repo.findAlbum(weddingId, input.albumId)))
    throw albumMissing();
  await enforceAuthLimit(`gallery-upload:${userId}`, 40, 60 * 60 * 1000);
  const { client, bucket } = storage();
  const extension = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" }[
    input.mimeType
  ];
  const key = `gallery-staging/${weddingId}/${randomUUID()}.${extension}`;
  const expiresAt = new Date(Date.now() + 5 * 60_000);
  const photo = await repo.createPendingPhoto({
    weddingId,
    albumId: input.albumId,
    objectKey: key,
    originalName: input.fileName,
    caption: input.caption,
    mimeType: input.mimeType,
    sizeBytes: input.sizeBytes,
    uploadedByUserId: userId,
    uploadExpiresAt: expiresAt,
  });
  const uploadUrl = await getSignedUrl(
    client,
    new PutObjectCommand({ Bucket: bucket, Key: key, ContentType: input.mimeType }),
    { expiresIn: 300 },
  );
  return {
    photoId: String(photo._id),
    uploadUrl,
    expiresAt: expiresAt.toISOString(),
    contentType: input.mimeType,
  };
}

function validMagic(mimeType: string, bytes: Uint8Array) {
  if (mimeType === "image/jpeg") return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  if (mimeType === "image/png")
    return [137, 80, 78, 71, 13, 10, 26, 10].every((n, i) => bytes[i] === n);
  return (
    mimeType === "image/webp" &&
    new TextDecoder().decode(bytes.slice(0, 4)) === "RIFF" &&
    new TextDecoder().decode(bytes.slice(8, 12)) === "WEBP"
  );
}

export async function finishUpload(weddingId: string, userId: string, photoId: string) {
  await memberReady(weddingId, userId);
  if (!isId(photoId)) throw photoMissing();
  const photo = await repo.findPendingPhoto(photoId, weddingId, userId);
  if (!photo) throw photoMissing();
  if (!photo.uploadExpiresAt || photo.uploadExpiresAt < new Date())
    throw new AppError(
      "UPLOAD_EXPIRED",
      "This upload expired. Please select the photo again.",
      409,
    );
  if (!(await repo.findAlbum(weddingId, String(photo.albumId)))) throw albumMissing();
  const { client, bucket } = storage();
  let head;
  try {
    head = await client.send(new HeadObjectCommand({ Bucket: bucket, Key: photo.objectKey }));
  } catch {
    throw new AppError("UPLOAD_INCOMPLETE", "The photo has not finished uploading.", 409);
  }
  if (head.ContentLength !== photo.sizeBytes || head.ContentType !== photo.mimeType)
    throw new AppError(
      "PHOTO_UPLOAD_INVALID",
      "The uploaded file does not match its details.",
      422,
    );
  const sample = await client.send(
    new GetObjectCommand({ Bucket: bucket, Key: photo.objectKey, Range: "bytes=0-15" }),
  );
  const bytes = await sample.Body?.transformToByteArray();
  if (!bytes || !validMagic(photo.mimeType, bytes))
    throw new AppError("PHOTO_UPLOAD_INVALID", "Choose a valid JPEG, PNG, or WebP photo.", 422);
  const finalKey = `weddings/${weddingId}/gallery/photos/${photo.objectKey.split("/").at(-1)}`;
  await client.send(
    new CopyObjectCommand({
      Bucket: bucket,
      Key: finalKey,
      CopySource: `${bucket}/${photo.objectKey}`,
    }),
  );
  const completed = await repo.finalizePendingPhoto(photoId, finalKey);
  if (!completed) throw photoMissing();
  try {
    await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: photo.objectKey }));
  } catch {
    // The private staging copy can be removed by the bucket's lifecycle rule.
  }
  return photoDto(completed);
}

export async function updatePhoto(photoId: string, userId: string, input: UpdatePhotoInput) {
  if (!isId(photoId)) throw photoMissing();
  const photo = await repo.findEditablePhoto(photoId);
  if (!photo) throw photoMissing();
  await memberReady(String(photo.weddingId), userId);
  if (
    input.albumId &&
    (!isId(input.albumId) || !(await repo.findAlbum(String(photo.weddingId), input.albumId)))
  )
    throw albumMissing();
  const updated = await repo.updatePhotoRecord(photoId, {
    ...(input.caption !== undefined ? { caption: input.caption } : {}),
    ...(input.albumId ? { albumId: input.albumId } : {}),
    ...(input.published !== undefined
      ? {
          status: input.published ? ("PUBLISHED" as const) : ("DRAFT" as const),
          publishedAt: input.published ? new Date() : null,
        }
      : {}),
  });
  if (!updated) throw photoMissing();
  return photoDto(updated);
}

export async function deletePhoto(photoId: string, userId: string) {
  if (!isId(photoId)) throw photoMissing();
  const photo = await repo.findPhoto(photoId);
  if (!photo) throw photoMissing();
  await memberReady(String(photo.weddingId), userId);
  const { client, bucket } = storage();
  await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: photo.objectKey }));
  await repo.deletePhotoRecord(photoId);
}

export async function findViewablePhoto(photoId: string) {
  if (!isId(photoId)) throw photoMissing();
  await connectToDatabase();
  await repo.ensureGalleryStorage();
  const photo = await repo.findPhoto(photoId);
  if (!photo || (photo.status !== "DRAFT" && photo.status !== "PUBLISHED")) throw photoMissing();
  return photo;
}

export async function signedPhotoUrl(objectKey: string) {
  const { client, bucket } = storage();
  return getSignedUrl(client, new GetObjectCommand({ Bucket: bucket, Key: objectKey }), {
    expiresIn: 60,
  });
}

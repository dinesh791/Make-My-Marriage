import "server-only";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE_NAME } from "@/lib/auth/session";
import { guestAccessCookieName } from "@/lib/auth/guest-access";
import { requireSameOrigin, readAuthJson } from "@/lib/http/auth-request";
import { errorResponse, successResponse } from "@/lib/http/api-response";
import { AppError } from "@/lib/http/errors";
import { getCurrentUser } from "@/modules/auth/auth.service";
import { canViewWeddingDetails } from "@/modules/guest-invitation/guest-invitation.service";
import { getPublicWeddingBySlug, getWeddingForMember } from "@/modules/wedding/wedding.service";
import * as gallery from "./gallery.service";
import {
  createAlbumSchema,
  updateAlbumSchema,
  uploadInitSchema,
  uploadCompleteSchema,
  updatePhotoSchema,
} from "./gallery.validators";

function privateResponse(response: Response) {
  const headers = new Headers(response.headers);
  headers.set("Cache-Control", "no-store, private");
  headers.set("Vary", "Cookie");
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}
function failure(error: unknown) {
  if (error instanceof AppError)
    return errorResponse(error.code, error.message, error.status, error.details);
  return errorResponse(
    "SERVICE_UNAVAILABLE",
    "We couldn't complete that request. Please try again shortly.",
    503,
  );
}
async function userId(request: NextRequest) {
  const user = await getCurrentUser(request.cookies.get(SESSION_COOKIE_NAME)?.value);
  if (!user) throw new AppError("AUTH_SESSION_REQUIRED", "Please sign in to continue.", 401);
  return user.id;
}
async function run(action: () => Promise<Response>) {
  try {
    return privateResponse(await action());
  } catch (error) {
    return privateResponse(failure(error));
  }
}

export const listMemberGallery = (request: NextRequest, weddingId: string) =>
  run(async () => successResponse(await gallery.memberGallery(weddingId, await userId(request))));

export const addAlbum = (request: NextRequest, weddingId: string) =>
  run(async () => {
    requireSameOrigin(request);
    const user = await userId(request);
    const { name } = await readAuthJson(request, createAlbumSchema);
    return successResponse(
      { album: await gallery.createAlbum(weddingId, user, name) },
      "Album created.",
      201,
    );
  });

export const editAlbum = (request: NextRequest, albumId: string) =>
  run(async () => {
    requireSameOrigin(request);
    const user = await userId(request);
    const { name } = await readAuthJson(request, updateAlbumSchema);
    return successResponse({ album: await gallery.updateAlbum(albumId, user, name) });
  });

export const removeAlbum = (request: NextRequest, albumId: string) =>
  run(async () => {
    requireSameOrigin(request);
    await gallery.deleteAlbum(albumId, await userId(request));
    return successResponse({ deleted: true });
  });

export const initiateUpload = (request: NextRequest, weddingId: string) =>
  run(async () => {
    requireSameOrigin(request);
    const user = await userId(request);
    const input = await readAuthJson(request, uploadInitSchema);
    return successResponse(await gallery.startUpload(weddingId, user, input), null, 201);
  });

export const completeUpload = (request: NextRequest, weddingId: string) =>
  run(async () => {
    requireSameOrigin(request);
    const user = await userId(request);
    const { photoId } = await readAuthJson(request, uploadCompleteSchema);
    return successResponse({ photo: await gallery.finishUpload(weddingId, user, photoId) });
  });

export const initiateGuestUpload = (request: NextRequest, slug: string) =>
  run(async () => {
    requireSameOrigin(request);
    const wedding = await getPublicWeddingBySlug(slug);
    if (!wedding) throw new AppError("WEDDING_NOT_FOUND", "Wedding not found.", 404);
    const weddingId = String(wedding._id);
    const input = await readAuthJson(request, uploadInitSchema);
    const guestToken = request.cookies.get(guestAccessCookieName(weddingId))?.value;
    return successResponse(await gallery.startGuestUpload(weddingId, guestToken, input), null, 201);
  });

export const completeGuestUpload = (request: NextRequest, slug: string) =>
  run(async () => {
    requireSameOrigin(request);
    const wedding = await getPublicWeddingBySlug(slug);
    if (!wedding) throw new AppError("WEDDING_NOT_FOUND", "Wedding not found.", 404);
    const weddingId = String(wedding._id);
    const { photoId } = await readAuthJson(request, uploadCompleteSchema);
    const guestToken = request.cookies.get(guestAccessCookieName(weddingId))?.value;
    return successResponse({
      photo: await gallery.finishGuestUpload(weddingId, guestToken, photoId),
    });
  });

export const editPhoto = (request: NextRequest, photoId: string) =>
  run(async () => {
    requireSameOrigin(request);
    const user = await userId(request);
    const input = await readAuthJson(request, updatePhotoSchema);
    return successResponse({ photo: await gallery.updatePhoto(photoId, user, input) });
  });

export const removePhoto = (request: NextRequest, photoId: string) =>
  run(async () => {
    requireSameOrigin(request);
    await gallery.deletePhoto(photoId, await userId(request));
    return successResponse({ deleted: true });
  });

export const listPublicGallery = (request: NextRequest, slug: string) =>
  run(async () => {
    const wedding = await getPublicWeddingBySlug(slug);
    if (!wedding) throw new AppError("WEDDING_NOT_FOUND", "Wedding not found.", 404);
    const user = await getCurrentUser(request.cookies.get(SESSION_COOKIE_NAME)?.value);
    const weddingId = String(wedding._id);
    if (
      !(await canViewWeddingDetails(
        weddingId,
        request.cookies.get(guestAccessCookieName(weddingId))?.value,
        user?.id,
      ))
    )
      throw new AppError(
        "GALLERY_ACCESS_REQUIRED",
        "Confirm your attendance to view wedding photos.",
        403,
      );
    return successResponse(await gallery.publishedGallery(weddingId));
  });

export const servePhoto = (request: NextRequest, photoId: string) =>
  run(async () => {
    const photo = await gallery.findViewablePhoto(photoId);
    const user = await getCurrentUser(request.cookies.get(SESSION_COOKIE_NAME)?.value);
    const weddingId = String(photo.weddingId);
    if (photo.status === "DRAFT") {
      if (!user) throw new AppError("PHOTO_NOT_FOUND", "Photo not found.", 404);
      await getWeddingForMember(weddingId, user.id);
    } else if (
      !(await canViewWeddingDetails(
        weddingId,
        request.cookies.get(guestAccessCookieName(weddingId))?.value,
        user?.id,
      ))
    ) {
      throw new AppError("PHOTO_NOT_FOUND", "Photo not found.", 404);
    }
    return Response.redirect(await gallery.signedPhotoUrl(photo.objectKey), 302);
  });

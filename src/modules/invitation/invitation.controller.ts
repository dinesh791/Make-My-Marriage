import "server-only";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE_NAME } from "@/lib/auth/session";
import { guestAccessCookieName } from "@/lib/auth/guest-access";
import { readAuthJson, requireSameOrigin } from "@/lib/http/auth-request";
import { errorResponse, successResponse } from "@/lib/http/api-response";
import { AppError } from "@/lib/http/errors";
import { getCurrentUser } from "@/modules/auth/auth.service";
import { getPublicWeddingBySlug } from "@/modules/wedding/wedding.service";
import { canViewWeddingDetails } from "@/modules/guest-invitation/guest-invitation.service";
import { saveInvitationSchema, publishInvitationSchema } from "./invitation.validators";
import * as service from "./invitation.service";

async function respond(action: () => Promise<Response>) {
  let response;
  try {
    response = await action();
  } catch (error) {
    response =
      error instanceof AppError
        ? errorResponse(error.code, error.message, error.status, error.details)
        : errorResponse(
            "SERVICE_UNAVAILABLE",
            "We couldn't complete that request. Please try again shortly.",
            503,
          );
  }
  response.headers.set("Cache-Control", "no-store, private");
  response.headers.set("Vary", "Cookie");
  return response;
}
async function memberUser(request: NextRequest) {
  const user = await getCurrentUser(request.cookies.get(SESSION_COOKIE_NAME)?.value);
  if (!user) throw new AppError("AUTH_SESSION_REQUIRED", "Please sign in to continue.", 401);
  return user;
}
export function getInvitation(request: NextRequest, weddingId: string) {
  return respond(async () => {
    const user = await memberUser(request);
    return successResponse({ invitation: await service.getMemberInvitation(weddingId, user.id) });
  });
}
export function saveInvitation(request: NextRequest, weddingId: string) {
  return respond(async () => {
    requireSameOrigin(request);
    const user = await memberUser(request);
    const input = await readAuthJson(request, saveInvitationSchema);
    return successResponse(
      { invitation: await service.saveInvitationDraft(weddingId, user.id, input) },
      "Draft saved.",
    );
  });
}
export function publishInvitation(request: NextRequest, weddingId: string) {
  return respond(async () => {
    requireSameOrigin(request);
    const user = await memberUser(request);
    const { revision } = await readAuthJson(request, publishInvitationSchema);
    return successResponse(
      { invitation: await service.publishInvitation(weddingId, user.id, revision) },
      "Invitation published.",
    );
  });
}
export function previewInvitation(request: NextRequest, weddingId: string) {
  return respond(async () => {
    const user = await memberUser(request);
    return successResponse(await service.getInvitationPreview(weddingId, user.id));
  });
}
export function publicInvitation(request: NextRequest, slug: string) {
  return respond(async () => {
    const wedding = await getPublicWeddingBySlug(slug);
    if (!wedding) throw new AppError("WEDDING_NOT_FOUND", "Wedding not found.", 404);
    const weddingId = String(wedding._id);
    const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    const user = token ? await getCurrentUser(token) : null;
    const unlocked = await canViewWeddingDetails(
      weddingId,
      request.cookies.get(guestAccessCookieName(weddingId))?.value,
      user?.id,
    );
    return successResponse({
      invitation: unlocked ? await service.getPublishedInvitation(weddingId) : null,
    });
  });
}

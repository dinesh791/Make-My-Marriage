import "server-only";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE_NAME } from "@/lib/auth/session";
import { guestAccessCookieName } from "@/lib/auth/guest-access";
import { readAuthJson, requireSameOrigin } from "@/lib/http/auth-request";
import { errorResponse, successResponse } from "@/lib/http/api-response";
import { AppError } from "@/lib/http/errors";
import { getCurrentUser } from "@/modules/auth/auth.service";
import { canViewWeddingDetails } from "@/modules/guest-invitation/guest-invitation.service";
import { getPublicWeddingBySlug } from "@/modules/wedding/wedding.service";
import * as service from "./event.service";
import { saveCustomEventSchema, saveEventSchema } from "./event.validators";

function privateResponse(response: Response) {
  response.headers.set("Cache-Control", "no-store, private");
  response.headers.set("Vary", "Cookie");
  return response;
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

async function signedInUser(request: NextRequest) {
  const user = await getCurrentUser(request.cookies.get(SESSION_COOKIE_NAME)?.value);
  if (!user) throw new AppError("AUTH_SESSION_REQUIRED", "Please sign in to continue.", 401);
  return user;
}

export async function listMemberEvents(request: NextRequest, weddingId: string) {
  try {
    const user = await signedInUser(request);
    const events = await service.listMemberEvents(weddingId, user.id);
    return privateResponse(successResponse({ events }));
  } catch (error) {
    return privateResponse(failure(error));
  }
}

export async function saveMemberEvent(request: NextRequest, weddingId: string, type: string) {
  try {
    requireSameOrigin(request);
    const user = await signedInUser(request);
    const eventType = service.parseEventType(type);
    const input = await readAuthJson(request, saveEventSchema);
    const event = await service.saveMemberEvent(weddingId, user.id, eventType, input);
    return privateResponse(successResponse({ event }, "Event saved."));
  } catch (error) {
    return privateResponse(failure(error));
  }
}

export async function createMemberCustomEvent(request: NextRequest, weddingId: string) {
  try {
    requireSameOrigin(request);
    const user = await signedInUser(request);
    const input = await readAuthJson(request, saveCustomEventSchema);
    const event = await service.createMemberCustomEvent(weddingId, user.id, input);
    return privateResponse(successResponse({ event }, "Custom event created."));
  } catch (error) {
    return privateResponse(failure(error));
  }
}

export async function saveMemberCustomEvent(
  request: NextRequest,
  weddingId: string,
  eventId: string,
) {
  try {
    requireSameOrigin(request);
    const user = await signedInUser(request);
    const input = await readAuthJson(request, saveCustomEventSchema);
    const event = await service.saveMemberCustomEvent(weddingId, user.id, eventId, input);
    return privateResponse(successResponse({ event }, "Custom event saved."));
  } catch (error) {
    return privateResponse(failure(error));
  }
}

export async function deleteMemberCustomEvent(
  request: NextRequest,
  weddingId: string,
  eventId: string,
) {
  try {
    requireSameOrigin(request);
    const user = await signedInUser(request);
    await service.deleteMemberCustomEvent(weddingId, user.id, eventId);
    return privateResponse(successResponse({ deleted: true }, "Custom event deleted."));
  } catch (error) {
    return privateResponse(failure(error));
  }
}

export async function deleteMemberPredefinedEvent(
  request: NextRequest,
  weddingId: string,
  type: string,
) {
  try {
    requireSameOrigin(request);
    const user = await signedInUser(request);
    const eventType = service.parseEventType(type);
    await service.deleteMemberPredefinedEvent(weddingId, user.id, eventType);
    return privateResponse(successResponse({ deleted: true }, "Event deleted."));
  } catch (error) {
    return privateResponse(failure(error));
  }
}

export async function listPublicEvents(request: NextRequest, slug: string) {
  try {
    const wedding = await getPublicWeddingBySlug(slug);
    if (!wedding) throw new AppError("WEDDING_NOT_FOUND", "Wedding not found.", 404);
    const weddingId = String(wedding._id);
    const sessionToken = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    const user = sessionToken ? await getCurrentUser(sessionToken) : null;
    const unlocked = await canViewWeddingDetails(
      weddingId,
      request.cookies.get(guestAccessCookieName(weddingId))?.value,
      user?.id,
    );
    const events = unlocked ? await service.listPublishedEvents(weddingId) : [];
    return privateResponse(successResponse({ events }));
  } catch (error) {
    return privateResponse(failure(error));
  }
}

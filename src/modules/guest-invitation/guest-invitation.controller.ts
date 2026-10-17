import "server-only";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE_NAME } from "@/lib/auth/session";
import { guestAccessCookieName, guestAccessCookieOptions } from "@/lib/auth/guest-access";
import { errorResponse, successResponse } from "@/lib/http/api-response";
import { readAuthJson, requireSameOrigin } from "@/lib/http/auth-request";
import { AppError } from "@/lib/http/errors";
import { getCurrentUser } from "@/modules/auth/auth.service";
import {
  listGuestInvitations,
  respondToGuestInvitation,
  sendGuestInvitations,
} from "./guest-invitation.service";
import { guestResponseSchema, sendGuestInvitationsSchema } from "./guest-invitation.validators";

function noStore(response: Response) {
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

export async function listInvitations(request: NextRequest, weddingId: string) {
  try {
    const user = await signedInUser(request);
    return noStore(
      successResponse({ invitations: await listGuestInvitations(weddingId, user.id) }),
    );
  } catch (error) {
    return noStore(failure(error));
  }
}

export async function sendInvitations(request: NextRequest, weddingId: string) {
  try {
    requireSameOrigin(request);
    const user = await signedInUser(request);
    const input = await readAuthJson(request, sendGuestInvitationsSchema);
    const results = await sendGuestInvitations(weddingId, user.id, input.recipients);
    return noStore(successResponse({ results }, "Invitation delivery attempted."));
  } catch (error) {
    return noStore(failure(error));
  }
}

export async function respondToInvitation(request: NextRequest, token: string) {
  try {
    requireSameOrigin(request);
    const input = await readAuthJson(request, guestResponseSchema);
    const result = await respondToGuestInvitation(token, input.response);
    const response = successResponse({ attending: result.attending, slug: result.slug });
    if (result.attending)
      response.cookies.set(guestAccessCookieName(result.weddingId), token, {
        ...guestAccessCookieOptions,
        expires: result.expiresAt,
      });
    return noStore(response);
  } catch (error) {
    return noStore(failure(error));
  }
}

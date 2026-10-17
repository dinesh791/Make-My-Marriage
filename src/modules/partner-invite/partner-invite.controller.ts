import "server-only";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE_NAME } from "@/lib/auth/session";
import { errorResponse, successResponse } from "@/lib/http/api-response";
import { requireSameOrigin } from "@/lib/http/auth-request";
import { AppError } from "@/lib/http/errors";
import { getCurrentUser } from "@/modules/auth/auth.service";
import { acceptPartnerInvite, createPartnerInvite } from "./partner-invite.service";

function privateResponse(response: Response) {
  response.headers.set("Cache-Control", "no-store, private");
  response.headers.set("Vary", "Cookie");
  return response;
}

function failure(error: unknown) {
  if (error instanceof AppError) {
    return errorResponse(error.code, error.message, error.status, error.details);
  }
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

export async function createInvite(request: NextRequest, weddingId: string) {
  try {
    requireSameOrigin(request);
    const user = await signedInUser(request);
    const invite = await createPartnerInvite(weddingId, user.id);
    return privateResponse(successResponse(invite, "Partner invitation created.", 201));
  } catch (error) {
    return privateResponse(failure(error));
  }
}

export async function acceptInvite(request: NextRequest, token: string) {
  try {
    requireSameOrigin(request);
    const user = await signedInUser(request);
    await acceptPartnerInvite(token, user.id);
    return privateResponse(successResponse({ joined: true }, "You joined the wedding."));
  } catch (error) {
    return privateResponse(failure(error));
  }
}

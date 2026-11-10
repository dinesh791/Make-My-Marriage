import "server-only";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE_NAME } from "@/lib/auth/session";
import { guestAccessCookieName } from "@/lib/auth/guest-access";
import { readAuthJson, requireSameOrigin } from "@/lib/http/auth-request";
import { errorResponse, successResponse } from "@/lib/http/api-response";
import { AppError } from "@/lib/http/errors";
import { getCurrentUser } from "@/modules/auth/auth.service";
import { canViewLivestream } from "@/modules/guest-invitation/guest-invitation.service";
import { getPublicWeddingBySlug } from "@/modules/wedding/wedding.service";
import { livestreamInputSchema } from "./livestream.validators";
import * as service from "./livestream.service";

function privateResponse(response: Response) {
  response.headers.set("Cache-Control", "no-store, private");
  response.headers.set("Vary", "Cookie");
  return response;
}
function failure(error: unknown) {
  return error instanceof AppError
    ? errorResponse(error.code, error.message, error.status, error.details)
    : errorResponse(
        "SERVICE_UNAVAILABLE",
        "We couldn't load the livestream. Please try again shortly.",
        503,
      );
}
export async function memberLivestreamRequest(request: NextRequest, weddingId: string) {
  try {
    if (request.method !== "GET") requireSameOrigin(request);
    const user = await getCurrentUser(request.cookies.get(SESSION_COOKIE_NAME)?.value);
    if (!user) throw new AppError("AUTH_SESSION_REQUIRED", "Please sign in to continue.", 401);
    if (request.method === "DELETE") {
      await service.deleteLivestream(weddingId, user.id);
      return privateResponse(successResponse({ deleted: true }));
    }
    const livestream =
      request.method === "GET"
        ? await service.getLivestream(weddingId, user.id)
        : await service.saveLivestream(
            weddingId,
            user.id,
            await readAuthJson(request, livestreamInputSchema),
          );
    return privateResponse(successResponse({ livestream }));
  } catch (error) {
    return privateResponse(failure(error));
  }
}
export async function publicLivestreamRequest(request: NextRequest, slug: string) {
  try {
    const wedding = await getPublicWeddingBySlug(slug);
    if (!wedding) throw new AppError("WEDDING_NOT_FOUND", "Wedding not found.", 404);
    const weddingId = String(wedding._id);
    const user = await getCurrentUser(request.cookies.get(SESSION_COOKIE_NAME)?.value);
    const allowed = await canViewLivestream(
      weddingId,
      request.cookies.get(guestAccessCookieName(weddingId))?.value,
      user?.id,
    );
    if (!allowed)
      throw new AppError(
        "WEDDING_ACCESS_REQUIRED",
        "Please respond to your invitation with attending or watching online to view this livestream.",
        403,
      );
    return privateResponse(
      successResponse({ livestream: await service.getEnabledLivestream(weddingId) }),
    );
  } catch (error) {
    return privateResponse(failure(error));
  }
}

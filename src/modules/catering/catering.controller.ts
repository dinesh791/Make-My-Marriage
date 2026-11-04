import "server-only";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE_NAME } from "@/lib/auth/session";
import { readAuthJson, requireSameOrigin } from "@/lib/http/auth-request";
import { errorResponse, successResponse } from "@/lib/http/api-response";
import { AppError } from "@/lib/http/errors";
import { getCurrentUser } from "@/modules/auth/auth.service";
import { cateringSchema } from "./catering.validators";
import * as service from "./catering.service";
export async function cateringRequest(request: NextRequest, weddingId: string) {
  let response: Response;
  try {
    if (request.method !== "GET") requireSameOrigin(request);
    const user = await getCurrentUser(request.cookies.get(SESSION_COOKIE_NAME)?.value);
    if (!user) throw new AppError("AUTH_SESSION_REQUIRED", "Please sign in to continue.", 401);
    if (request.method === "DELETE") {
      await service.deleteCatering(weddingId, user.id);
      response = successResponse({ deleted: true });
    } else {
      const catering =
        request.method === "GET"
          ? await service.getCatering(weddingId, user.id)
          : await service.saveCatering(
              weddingId,
              user.id,
              await readAuthJson(request, cateringSchema),
            );
      response = successResponse({ catering });
    }
  } catch (error) {
    response =
      error instanceof AppError
        ? errorResponse(error.code, error.message, error.status, error.details)
        : errorResponse(
            "SERVICE_UNAVAILABLE",
            "We couldn't load catering. Please try again shortly.",
            503,
          );
  }
  response.headers.set("Cache-Control", "no-store, private");
  response.headers.set("Vary", "Cookie");
  return response;
}

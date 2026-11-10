import "server-only";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE_NAME } from "@/lib/auth/session";
import { readAuthJson, requireSameOrigin } from "@/lib/http/auth-request";
import { errorResponse, successResponse } from "@/lib/http/api-response";
import { AppError } from "@/lib/http/errors";
import { updateProfileSchema } from "@/modules/auth/auth.validators";
import * as service from "./account.service";

export async function updateProfileController(request: NextRequest) {
  try {
    requireSameOrigin(request);
    const input = await readAuthJson(request, updateProfileSchema);
    const result = await service.updateProfile(
      request.cookies.get(SESSION_COOKIE_NAME)?.value,
      input,
    );
    const response = successResponse(
      { user: result.user },
      result.emailChanged
        ? "Account details and sign-in email updated. The new email is not verified."
        : "Account details updated.",
    );
    response.headers.set("Cache-Control", "no-store, private");
    response.headers.set("Vary", "Cookie");
    return response;
  } catch (error) {
    if (error instanceof AppError) {
      const response = errorResponse(error.code, error.message, error.status, error.details);
      response.headers.set("Cache-Control", "no-store, private");
      response.headers.set("Vary", "Cookie");
      return response;
    }
    console.error("Account profile update unavailable", {
      category: error instanceof Error ? error.name : "unknown",
    });
    const response = errorResponse(
      "SERVICE_UNAVAILABLE",
      "We couldn't complete that request. Please try again shortly.",
      503,
    );
    response.headers.set("Cache-Control", "no-store, private");
    response.headers.set("Vary", "Cookie");
    return response;
  }
}

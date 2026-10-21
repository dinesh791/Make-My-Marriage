import "server-only";
import type { NextRequest, NextResponse } from "next/server";
import { successResponse, errorResponse } from "@/lib/http/api-response";
import { AppError } from "@/lib/http/errors";
import { readAuthJson, requireSameOrigin } from "@/lib/http/auth-request";
import { SESSION_COOKIE_NAME, sessionCookieOptions } from "@/lib/auth/session";
import { loginSchema, registerSchema } from "./auth.validators";
import * as service from "./auth.service";

type Action = "register" | "login" | "logout" | "me";
type AuthStage = "origin" | "rate-limit" | "account";

function failureCategory(error: unknown) {
  if (!(error instanceof Error)) return "unknown";
  if (error.message.startsWith("Invalid environment configuration:")) return "environment";
  if (error.message === "Authentication storage is not provisioned; run npm run db:setup.")
    return "storage-indexes";
  if (error.name === "MongoParseError") return "database-uri";
  if (error.name === "MongoServerSelectionError") return "database-selection";
  if (error.name === "MongoNetworkError") return "database-network";
  if (error.name === "MongoServerError") {
    const code = "code" in error ? error.code : undefined;
    if (code === 18 || code === 8000) return "database-authentication";
    if (code === 13) return "database-permission";
    return "database-server";
  }
  return "unknown";
}

function privateResponse(response: NextResponse) {
  response.headers.set("Cache-Control", "no-store, private");
  response.headers.set("Vary", "Cookie");
  return response;
}

export async function authController(request: NextRequest, action: Action) {
  let stage: AuthStage = "origin";
  try {
    const previousToken = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    if (action === "me") {
      stage = "account";
      const user = await service.getCurrentUser(previousToken);
      if (!user) throw new AppError("AUTH_SESSION_REQUIRED", "Please sign in to continue.", 401);
      return privateResponse(successResponse({ user }));
    }
    requireSameOrigin(request);
    if (action === "logout") {
      stage = "account";
      await service.logout(previousToken);
      const response = successResponse(null, "Signed out successfully.");
      response.cookies.set(SESSION_COOKIE_NAME, "", { ...sessionCookieOptions, maxAge: 0 });
      return privateResponse(response);
    }
    // Shared database counter caps password work across instances, even with rotating emails.
    // Add trusted per-IP limits at the deployment edge before public launch.
    stage = "rate-limit";
    await service.enforceAuthLimit(`global:${action}`, action === "register" ? 20 : 100, 60_000);
    stage = "account";
    const result =
      action === "register"
        ? await service.register(await readAuthJson(request, registerSchema), previousToken)
        : await service.login(await readAuthJson(request, loginSchema), previousToken);
    const response = successResponse(
      { user: result.user },
      action === "register" ? "Account created." : "Signed in.",
      action === "register" ? 201 : 200,
    );
    response.cookies.set(SESSION_COOKIE_NAME, result.session.token, {
      ...sessionCookieOptions,
      ...(result.session.remember ? { expires: result.session.expiresAt } : {}),
    });
    return privateResponse(response);
  } catch (error) {
    if (error instanceof AppError) {
      const response = errorResponse(error.code, error.message, error.status, error.details);
      if (error.code === "RATE_LIMITED") {
        response.headers.set(
          "Retry-After",
          String((error.details as { retryAfter: number }).retryAfter),
        );
      }
      return privateResponse(response);
    }
    // Emit only fixed diagnostic labels. Raw errors can contain connection strings or user data.
    console.error("Auth request unavailable", { action, stage, category: failureCategory(error) });
    return privateResponse(
      errorResponse(
        "SERVICE_UNAVAILABLE",
        "We couldn't complete that request. Please try again shortly.",
        503,
      ),
    );
  }
}

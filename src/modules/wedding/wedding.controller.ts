import "server-only";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE_NAME } from "@/lib/auth/session";
import { errorResponse, successResponse } from "@/lib/http/api-response";
import { AppError } from "@/lib/http/errors";
import { readAuthJson, requireSameOrigin } from "@/lib/http/auth-request";
import { getCurrentUser } from "@/modules/auth/auth.service";
import { toPublicWeddingDto, toWeddingDto } from "./wedding.dto";
import * as service from "./wedding.service";
import { createWeddingSchema, updateWeddingSchema } from "./wedding.validators";

function privateResponse(response: Response) {
  response.headers.set("Cache-Control", "no-store, private");
  response.headers.set("Vary", "Cookie");
  return response;
}

async function signedInUser(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const user = await getCurrentUser(token);
  if (!user) throw new AppError("AUTH_SESSION_REQUIRED", "Please sign in to continue.", 401);
  return user;
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

export async function listMyWedding(request: NextRequest) {
  try {
    const user = await signedInUser(request);
    const wedding = await service.getMyWedding(user.id);
    return privateResponse(successResponse({ wedding: wedding ? toWeddingDto(wedding) : null }));
  } catch (error) {
    return privateResponse(failure(error));
  }
}

export async function createMyWedding(request: NextRequest) {
  try {
    requireSameOrigin(request);
    const user = await signedInUser(request);
    const input = await readAuthJson(request, createWeddingSchema);
    const wedding = await service.createWedding(user.id, input);
    return privateResponse(
      successResponse({ wedding: toWeddingDto(wedding) }, "Wedding created.", 201),
    );
  } catch (error) {
    return privateResponse(failure(error));
  }
}

export async function getMemberWedding(request: NextRequest, weddingId: string) {
  try {
    const user = await signedInUser(request);
    const wedding = await service.getWeddingForMember(weddingId, user.id);
    return privateResponse(successResponse({ wedding: toWeddingDto(wedding) }));
  } catch (error) {
    return privateResponse(failure(error));
  }
}

export async function updateMemberWedding(request: NextRequest, weddingId: string) {
  try {
    requireSameOrigin(request);
    const user = await signedInUser(request);
    const input = await readAuthJson(request, updateWeddingSchema);
    const wedding = await service.updateWedding(weddingId, user.id, input);
    return privateResponse(successResponse({ wedding: toWeddingDto(wedding) }, "Wedding updated."));
  } catch (error) {
    return privateResponse(failure(error));
  }
}

export async function getPublicWedding(slug: string) {
  try {
    const wedding = await service.getPublicWeddingBySlug(slug);
    if (!wedding) throw new AppError("WEDDING_NOT_FOUND", "Wedding not found.", 404);
    return successResponse(toPublicWeddingDto(wedding));
  } catch (error) {
    return failure(error);
  }
}

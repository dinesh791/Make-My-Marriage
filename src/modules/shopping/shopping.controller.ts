import "server-only";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE_NAME } from "@/lib/auth/session";
import { readAuthJson, requireSameOrigin } from "@/lib/http/auth-request";
import { errorResponse, successResponse } from "@/lib/http/api-response";
import { AppError } from "@/lib/http/errors";
import { getCurrentUser } from "@/modules/auth/auth.service";
import * as service from "./shopping.service";
import { createShoppingItemSchema, updateShoppingItemSchema } from "./shopping.validators";

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

export async function listMemberShoppingItems(request: NextRequest, weddingId: string) {
  try {
    const user = await signedInUser(request);
    const items = await service.listMemberShoppingItems(weddingId, user.id);
    return privateResponse(successResponse({ items }));
  } catch (error) {
    return privateResponse(failure(error));
  }
}

export async function createMemberShoppingItem(request: NextRequest, weddingId: string) {
  try {
    requireSameOrigin(request);
    const user = await signedInUser(request);
    const input = await readAuthJson(request, createShoppingItemSchema);
    const item = await service.createMemberShoppingItem(weddingId, user.id, input);
    return privateResponse(successResponse({ item }, "Shopping item created.", 201));
  } catch (error) {
    return privateResponse(failure(error));
  }
}

export async function updateMemberShoppingItem(request: NextRequest, itemId: string) {
  try {
    requireSameOrigin(request);
    const user = await signedInUser(request);
    const input = await readAuthJson(request, updateShoppingItemSchema);
    const item = await service.updateMemberShoppingItem(itemId, user.id, input);
    return privateResponse(successResponse({ item }, "Shopping item updated."));
  } catch (error) {
    return privateResponse(failure(error));
  }
}

export async function deleteMemberShoppingItem(request: NextRequest, itemId: string) {
  try {
    requireSameOrigin(request);
    const user = await signedInUser(request);
    await service.deleteMemberShoppingItem(itemId, user.id);
    return privateResponse(successResponse({ deleted: true }, "Shopping item deleted."));
  } catch (error) {
    return privateResponse(failure(error));
  }
}

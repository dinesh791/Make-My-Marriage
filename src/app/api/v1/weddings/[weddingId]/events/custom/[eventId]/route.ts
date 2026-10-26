import type { NextRequest } from "next/server";
import { deleteMemberCustomEvent, saveMemberCustomEvent } from "@/modules/event/event.controller";

export const runtime = "nodejs";

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ weddingId: string; eventId: string }> },
) {
  const { weddingId, eventId } = await context.params;
  return saveMemberCustomEvent(request, weddingId, eventId);
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ weddingId: string; eventId: string }> },
) {
  const { weddingId, eventId } = await context.params;
  return deleteMemberCustomEvent(request, weddingId, eventId);
}

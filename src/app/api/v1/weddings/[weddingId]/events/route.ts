import type { NextRequest } from "next/server";
import { createMemberCustomEvent, listMemberEvents } from "@/modules/event/event.controller";

export const runtime = "nodejs";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ weddingId: string }> },
) {
  const { weddingId } = await context.params;
  return listMemberEvents(request, weddingId);
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ weddingId: string }> },
) {
  const { weddingId } = await context.params;
  return createMemberCustomEvent(request, weddingId);
}

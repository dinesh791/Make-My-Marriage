import type { NextRequest } from "next/server";
import { saveMemberEvent } from "@/modules/event/event.controller";

export const runtime = "nodejs";

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ weddingId: string; type: string }> },
) {
  const { weddingId, type } = await context.params;
  return saveMemberEvent(request, weddingId, type);
}

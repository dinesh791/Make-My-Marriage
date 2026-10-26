import type { NextRequest } from "next/server";
import { previewInvitation } from "@/modules/invitation/invitation.controller";
export const runtime = "nodejs";
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ weddingId: string }> },
) {
  return previewInvitation(request, (await context.params).weddingId);
}

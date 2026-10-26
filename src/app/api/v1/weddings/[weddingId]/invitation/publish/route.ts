import type { NextRequest } from "next/server";
import { publishInvitation } from "@/modules/invitation/invitation.controller";
export const runtime = "nodejs";
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ weddingId: string }> },
) {
  return publishInvitation(request, (await context.params).weddingId);
}

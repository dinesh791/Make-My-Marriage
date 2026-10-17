import type { NextRequest } from "next/server";
import { createInvite } from "@/modules/partner-invite/partner-invite.controller";

export const runtime = "nodejs";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ weddingId: string }> },
) {
  const { weddingId } = await context.params;
  return createInvite(request, weddingId);
}

import type { NextRequest } from "next/server";
import {
  listInvitations,
  sendInvitations,
} from "@/modules/guest-invitation/guest-invitation.controller";

export const runtime = "nodejs";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ weddingId: string }> },
) {
  const { weddingId } = await context.params;
  return listInvitations(request, weddingId);
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ weddingId: string }> },
) {
  const { weddingId } = await context.params;
  return sendInvitations(request, weddingId);
}

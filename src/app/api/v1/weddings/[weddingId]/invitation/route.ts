import type { NextRequest } from "next/server";
import { getInvitation, saveInvitation } from "@/modules/invitation/invitation.controller";
export const runtime = "nodejs";
type Context = { params: Promise<{ weddingId: string }> };
export async function GET(request: NextRequest, context: Context) {
  return getInvitation(request, (await context.params).weddingId);
}
export async function PATCH(request: NextRequest, context: Context) {
  return saveInvitation(request, (await context.params).weddingId);
}

import type { NextRequest } from "next/server";
import { publicInvitation } from "@/modules/invitation/invitation.controller";
export const runtime = "nodejs";
export async function GET(request: NextRequest, context: { params: Promise<{ slug: string }> }) {
  return publicInvitation(request, (await context.params).slug);
}

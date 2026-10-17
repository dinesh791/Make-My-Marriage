import type { NextRequest } from "next/server";
import { respondToInvitation } from "@/modules/guest-invitation/guest-invitation.controller";

export const runtime = "nodejs";

export async function POST(request: NextRequest, context: { params: Promise<{ token: string }> }) {
  const { token } = await context.params;
  return respondToInvitation(request, token);
}

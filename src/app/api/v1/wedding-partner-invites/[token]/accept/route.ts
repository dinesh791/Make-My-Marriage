import type { NextRequest } from "next/server";
import { acceptInvite } from "@/modules/partner-invite/partner-invite.controller";

export const runtime = "nodejs";

export async function POST(request: NextRequest, context: { params: Promise<{ token: string }> }) {
  const { token } = await context.params;
  return acceptInvite(request, token);
}

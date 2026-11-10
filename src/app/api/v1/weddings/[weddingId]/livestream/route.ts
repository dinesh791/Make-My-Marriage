import type { NextRequest } from "next/server";
import { memberLivestreamRequest } from "@/modules/livestream/livestream.controller";
export const runtime = "nodejs";
async function handler(request: NextRequest, context: { params: Promise<{ weddingId: string }> }) {
  return memberLivestreamRequest(request, (await context.params).weddingId);
}
export { handler as GET, handler as PUT, handler as DELETE };

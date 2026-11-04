import type { NextRequest } from "next/server";
import { cateringRequest } from "@/modules/catering/catering.controller";
export const runtime = "nodejs";
async function handler(request: NextRequest, context: { params: Promise<{ weddingId: string }> }) {
  return cateringRequest(request, (await context.params).weddingId);
}
export { handler as GET, handler as PUT, handler as DELETE };

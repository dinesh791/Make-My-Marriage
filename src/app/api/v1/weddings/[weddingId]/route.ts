import type { NextRequest } from "next/server";
import { getMemberWedding } from "@/modules/wedding/wedding.controller";

export const runtime = "nodejs";
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ weddingId: string }> },
) {
  const { weddingId } = await context.params;
  return getMemberWedding(request, weddingId);
}

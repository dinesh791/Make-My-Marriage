import type { NextRequest } from "next/server";
import { getMemberWedding, updateMemberWedding } from "@/modules/wedding/wedding.controller";

export const runtime = "nodejs";
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ weddingId: string }> },
) {
  const { weddingId } = await context.params;
  return getMemberWedding(request, weddingId);
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ weddingId: string }> },
) {
  const { weddingId } = await context.params;
  return await updateMemberWedding(request, weddingId);
}

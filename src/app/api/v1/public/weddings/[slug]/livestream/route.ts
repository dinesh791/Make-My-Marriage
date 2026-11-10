import type { NextRequest } from "next/server";
import { publicLivestreamRequest } from "@/modules/livestream/livestream.controller";
export const runtime = "nodejs";
export async function GET(request: NextRequest, context: { params: Promise<{ slug: string }> }) {
  return publicLivestreamRequest(request, (await context.params).slug);
}

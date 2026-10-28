import type { NextRequest } from "next/server";
import { completeUpload } from "@/modules/gallery/gallery.controller";
export const runtime = "nodejs";
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ weddingId: string }> },
) {
  return completeUpload(request, (await context.params).weddingId);
}

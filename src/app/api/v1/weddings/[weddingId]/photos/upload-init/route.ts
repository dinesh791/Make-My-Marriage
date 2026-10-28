import type { NextRequest } from "next/server";
import { initiateUpload } from "@/modules/gallery/gallery.controller";
export const runtime = "nodejs";
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ weddingId: string }> },
) {
  return initiateUpload(request, (await context.params).weddingId);
}

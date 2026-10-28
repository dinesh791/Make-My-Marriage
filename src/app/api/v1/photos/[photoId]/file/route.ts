import type { NextRequest } from "next/server";
import { servePhoto } from "@/modules/gallery/gallery.controller";
export const runtime = "nodejs";
export async function GET(request: NextRequest, context: { params: Promise<{ photoId: string }> }) {
  return servePhoto(request, (await context.params).photoId);
}

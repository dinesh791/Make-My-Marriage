import type { NextRequest } from "next/server";
import { listPublicGallery } from "@/modules/gallery/gallery.controller";
export const runtime = "nodejs";
export async function GET(request: NextRequest, context: { params: Promise<{ slug: string }> }) {
  return listPublicGallery(request, (await context.params).slug);
}

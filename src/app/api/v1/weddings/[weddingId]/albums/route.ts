import type { NextRequest } from "next/server";
import { addAlbum, listMemberGallery } from "@/modules/gallery/gallery.controller";
export const runtime = "nodejs";
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ weddingId: string }> },
) {
  return listMemberGallery(request, (await context.params).weddingId);
}
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ weddingId: string }> },
) {
  return addAlbum(request, (await context.params).weddingId);
}

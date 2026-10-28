import type { NextRequest } from "next/server";
import { editAlbum, removeAlbum } from "@/modules/gallery/gallery.controller";
export const runtime = "nodejs";
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ albumId: string }> },
) {
  return editAlbum(request, (await context.params).albumId);
}
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ albumId: string }> },
) {
  return removeAlbum(request, (await context.params).albumId);
}

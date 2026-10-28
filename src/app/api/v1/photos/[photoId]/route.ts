import type { NextRequest } from "next/server";
import { editPhoto, removePhoto } from "@/modules/gallery/gallery.controller";
export const runtime = "nodejs";
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ photoId: string }> },
) {
  return editPhoto(request, (await context.params).photoId);
}
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ photoId: string }> },
) {
  return removePhoto(request, (await context.params).photoId);
}

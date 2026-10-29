import type { NextRequest } from "next/server";
import { initiateGuestUpload } from "@/modules/gallery/gallery.controller";

export const runtime = "nodejs";

export async function POST(request: NextRequest, context: { params: Promise<{ slug: string }> }) {
  return initiateGuestUpload(request, (await context.params).slug);
}

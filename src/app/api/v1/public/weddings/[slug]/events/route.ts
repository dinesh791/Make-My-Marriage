import type { NextRequest } from "next/server";
import { listPublicEvents } from "@/modules/event/event.controller";

export const runtime = "nodejs";

export async function GET(request: NextRequest, context: { params: Promise<{ slug: string }> }) {
  const { slug } = await context.params;
  return listPublicEvents(request, slug);
}

import { getPublicWedding } from "@/modules/wedding/wedding.controller";
import type { NextRequest } from "next/server";

export const runtime = "nodejs";

export async function GET(request: NextRequest, context: { params: Promise<{ slug: string }> }) {
  const { slug } = await context.params;
  return getPublicWedding(request, slug);
}

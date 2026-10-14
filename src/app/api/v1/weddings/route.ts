import type { NextRequest } from "next/server";
import { createMyWedding, listMyWedding } from "@/modules/wedding/wedding.controller";

export const runtime = "nodejs";
export function GET(request: NextRequest) {
  return listMyWedding(request);
}
export function POST(request: NextRequest) {
  return createMyWedding(request);
}

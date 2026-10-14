import type { NextRequest } from "next/server";
import { authController } from "@/modules/auth/auth.controller";

export const runtime = "nodejs";
export async function GET(request: NextRequest) {
  return authController(request, "me");
}

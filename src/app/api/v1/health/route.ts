import { successResponse } from "@/lib/http/api-response";

export const runtime = "nodejs";

export function GET() {
  return successResponse({ status: "ok" }, "API is healthy");
}

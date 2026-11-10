import type { NextRequest } from "next/server";
import { updateProfileController } from "@/modules/account/account.controller";

export const runtime = "nodejs";

export async function PATCH(request: NextRequest) {
  return updateProfileController(request);
}

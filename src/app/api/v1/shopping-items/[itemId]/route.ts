import type { NextRequest } from "next/server";
import {
  deleteMemberShoppingItem,
  updateMemberShoppingItem,
} from "@/modules/shopping/shopping.controller";

export const runtime = "nodejs";

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ itemId: string }> },
) {
  const { itemId } = await context.params;
  return updateMemberShoppingItem(request, itemId);
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ itemId: string }> },
) {
  const { itemId } = await context.params;
  return deleteMemberShoppingItem(request, itemId);
}

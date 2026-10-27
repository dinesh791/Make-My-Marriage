import type { NextRequest } from "next/server";
import {
  createMemberShoppingItem,
  listMemberShoppingItems,
} from "@/modules/shopping/shopping.controller";

export const runtime = "nodejs";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ weddingId: string }> },
) {
  const { weddingId } = await context.params;
  return listMemberShoppingItems(request, weddingId);
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ weddingId: string }> },
) {
  const { weddingId } = await context.params;
  return createMemberShoppingItem(request, weddingId);
}

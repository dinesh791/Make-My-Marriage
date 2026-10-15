import { getPublicWedding } from "@/modules/wedding/wedding.controller";

export const runtime = "nodejs";

export async function GET(_request: Request, context: { params: Promise<{ slug: string }> }) {
  const { slug } = await context.params;
  return getPublicWedding(slug);
}

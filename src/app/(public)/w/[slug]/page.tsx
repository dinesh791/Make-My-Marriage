import { PublicWeddingSite } from "@/components/shared/public-wedding-site";

export default async function PublicWeddingPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <PublicWeddingSite slug={slug} />;
}

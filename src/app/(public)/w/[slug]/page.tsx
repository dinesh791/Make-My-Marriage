import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LiveWeddingSite } from "@/components/shared/live-wedding-site";
import { PublicWeddingSite } from "@/components/shared/public-wedding-site";
import { toPublicWeddingDto } from "@/modules/wedding/wedding.dto";
import { getPublicWeddingBySlug } from "@/modules/wedding/wedding.service";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  if (slug === "dinesh-usha") return { title: "Dinesh & Usha Wedding | Make My Marriage" };
  const wedding = await getPublicWeddingBySlug(slug);
  if (!wedding) return { title: "Wedding not found", robots: { index: false } };
  return {
    title: `${wedding.title} | Make My Marriage`,
    description: `Join us to celebrate ${wedding.title} at ${wedding.venueName}.`,
  };
}

export default async function PublicWeddingPage({ params }: Props) {
  const { slug } = await params;
  if (slug === "dinesh-usha") return <PublicWeddingSite slug={slug} />;
  const wedding = await getPublicWeddingBySlug(slug);
  if (!wedding) notFound();
  return <LiveWeddingSite wedding={toPublicWeddingDto(wedding)} />;
}

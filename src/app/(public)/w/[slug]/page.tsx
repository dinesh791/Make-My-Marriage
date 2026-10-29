import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { LiveWeddingSite } from "@/components/shared/live-wedding-site";
import { PublicWeddingSite } from "@/components/shared/public-wedding-site";
import { toPublicWeddingDto } from "@/modules/wedding/wedding.dto";
import { getPublicWeddingBySlug } from "@/modules/wedding/wedding.service";
import {
  canViewWeddingDetails,
  getAttendingGuestInvitation,
} from "@/modules/guest-invitation/guest-invitation.service";
import { guestAccessCookieName } from "@/lib/auth/guest-access";
import { SESSION_COOKIE_NAME } from "@/lib/auth/session";
import { getCurrentUser } from "@/modules/auth/auth.service";
import { listPublishedEvents } from "@/modules/event/event.service";
import { getPublishedInvitation } from "@/modules/invitation/invitation.service";
import { guestUploadAlbums, publishedGallery } from "@/modules/gallery/gallery.service";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  if (slug === "dinesh-usha") return { title: "Dinesh & Usha Wedding | Make My Marriage" };
  const wedding = await getPublicWeddingBySlug(slug);
  if (!wedding) return { title: "Wedding not found", robots: { index: false } };
  return {
    title: `${wedding.title} | Make My Marriage`,
    description: `Join us to celebrate ${wedding.title}.`,
    robots: { index: false, follow: false },
  };
}

export default async function PublicWeddingPage({ params }: Props) {
  const { slug } = await params;
  if (slug === "dinesh-usha") return <PublicWeddingSite slug={slug} />;
  const wedding = await getPublicWeddingBySlug(slug);
  if (!wedding) notFound();
  const jar = await cookies();
  const sessionToken = jar.get(SESSION_COOKIE_NAME)?.value;
  const user = sessionToken ? await getCurrentUser(sessionToken) : null;
  const weddingId = String(wedding._id);
  const guestInvitation = await getAttendingGuestInvitation(
    weddingId,
    jar.get(guestAccessCookieName(weddingId))?.value,
  );
  const unlocked =
    Boolean(guestInvitation) || (await canViewWeddingDetails(weddingId, undefined, user?.id));
  const [events, invitation, gallery, uploadAlbums] = await Promise.all([
    unlocked ? listPublishedEvents(weddingId) : [],
    unlocked ? getPublishedInvitation(weddingId) : undefined,
    unlocked ? publishedGallery(weddingId) : { albums: [], photos: [] },
    guestInvitation ? guestUploadAlbums(weddingId) : [],
  ]);
  return (
    <LiveWeddingSite
      wedding={toPublicWeddingDto(wedding)}
      unlocked={unlocked}
      events={events}
      invitation={invitation}
      gallery={gallery}
      guestUploadAlbums={uploadAlbums}
      canGuestUpload={Boolean(guestInvitation)}
    />
  );
}

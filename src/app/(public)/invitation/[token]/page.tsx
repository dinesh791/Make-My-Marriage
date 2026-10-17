import type { Metadata } from "next";
import Link from "next/link";
import { AppError } from "@/lib/http/errors";
import { GuestRsvpForm } from "@/components/shared/guest-rsvp-form";
import { getGuestInvitation } from "@/modules/guest-invitation/guest-invitation.service";

export const metadata: Metadata = {
  title: "Wedding invitation | Make My Marriage",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

export default async function GuestInvitationPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  let invitation: Awaited<ReturnType<typeof getGuestInvitation>> | null = null;
  let error = "This invitation is unavailable. Ask the couple for help.";
  try {
    invitation = await getGuestInvitation(token);
  } catch (caught) {
    if (!(caught instanceof AppError))
      error = "We couldn't load your invitation. Please try again shortly.";
  }
  return (
    <main className="page-shell guest-invitation-page">
      <div className="setup-card">
        <span className="eyebrow">Make My Marriage</span>
        <h1>Wedding invitation</h1>
        {invitation ? (
          <>
            <h2 className="serif">{invitation.wedding.title}</h2>
            <p>You&apos;re invited to celebrate with us.</p>
            <p>
              <strong>
                {new Intl.DateTimeFormat("en-IN", {
                  dateStyle: "full",
                  timeZone: invitation.wedding.timezone,
                }).format(invitation.wedding.weddingDate)}
              </strong>
              <br />
              {invitation.wedding.venueName}
            </p>
            <p>
              Can you attend? Confirm to open the full wedding invitation and venue details. You do
              not need to create an account.
            </p>
            <GuestRsvpForm token={token} response={invitation.invitation.response} />
            <p className="field-hint">
              This is a personal invitation link. Please don&apos;t forward it.
            </p>
          </>
        ) : (
          <p>{error}</p>
        )}
        <p className="field-hint">
          <Link className="text-link" href="/">
            Back to website
          </Link>
        </p>
      </div>
    </main>
  );
}

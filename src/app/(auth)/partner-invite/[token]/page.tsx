import type { Metadata } from "next";
import Link from "next/link";
import { currentUser } from "@/lib/auth/current-user";
import { AppError } from "@/lib/http/errors";
import { getPartnerInvitePreview } from "@/modules/partner-invite/partner-invite.service";
import { AcceptPartnerInviteButton } from "@/components/shared/accept-partner-invite-button";

export const metadata: Metadata = {
  title: "Partner invitation | Make My Marriage",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

export default async function PartnerInvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  let invite: Awaited<ReturnType<typeof getPartnerInvitePreview>> | null = null;
  let unavailable = "This invitation is no longer available.";
  try {
    invite = await getPartnerInvitePreview(token);
  } catch (error) {
    if (error instanceof AppError) unavailable = error.message;
    else unavailable = "We couldn't load this invitation. Please try again shortly.";
  }
  const user = await currentUser();
  const next = `/partner-invite/${token}`;
  return (
    <main className="page-shell partner-invite-page">
      <div className="setup-card">
        <span className="eyebrow">Make My Marriage</span>
        <h1>Partner invitation</h1>
        {invite ? (
          <>
            <p>
              You&apos;ve been invited to join <strong>{invite.title}</strong> as{" "}
              {invite.targetRole === "BRIDE" ? "Bride" : "Groom"}.
            </p>
            <p className="field-hint">
              This invitation expires{" "}
              {new Intl.DateTimeFormat("en-IN", {
                dateStyle: "medium",
                timeStyle: "short",
                timeZone: "Asia/Kolkata",
              }).format(invite.expiresAt)}
              .
            </p>
            {user ? (
              <AcceptPartnerInviteButton token={token} />
            ) : (
              <div className="partner-invite-actions">
                <Link className="button" href={`/login?next=${encodeURIComponent(next)}`}>
                  Sign in to accept
                </Link>
                <Link
                  className="button button-outline"
                  href={`/register?next=${encodeURIComponent(next)}`}
                >
                  Create account
                </Link>
              </div>
            )}
          </>
        ) : (
          <p>{unavailable} Ask your partner for a new link.</p>
        )}
        <p className="field-hint">
          <Link className="text-link" href="/">
            Back to wedding website
          </Link>
        </p>
      </div>
    </main>
  );
}

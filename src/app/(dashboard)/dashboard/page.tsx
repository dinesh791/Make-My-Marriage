import Image from "next/image";
import Link from "next/link";
import { Brand } from "@/components/shared/brand";
import { SignOutButton } from "@/components/shared/sign-out-button";
import { requireUser } from "@/lib/auth/current-user";
import { WeddingSetupForm } from "@/components/shared/wedding-setup-form";
import { CopyWeddingLinkButton } from "@/components/shared/copy-wedding-link-button";
import { getMyWedding } from "@/modules/wedding/wedding.service";
import { toWeddingDto } from "@/modules/wedding/wedding.dto";
import { getPartnerStatus } from "@/modules/partner-invite/partner-invite.service";
import { PartnerInvitePanel } from "@/components/shared/partner-invite-panel";
import { GuestInvitationPanel } from "@/components/shared/guest-invitation-panel";
import {
  emailDeliveryConfigured,
  listGuestInvitations,
} from "@/modules/guest-invitation/guest-invitation.service";

const workspaceLinks = [
  ["Overview", "O", "#overview"],
  ["Couple details", "C", "#couple"],
  ["Wedding events", "E", "#events"],
  ["Invitation", "I", "#invitation"],
  ["Wedding website", "W", "#website"],
  ["Shopping checklist", "S", "#shopping"],
  ["Catering", "F", "#catering"],
  ["Photo gallery", "G", "#gallery"],
  ["Livestream", "L", "#livestream"],
];

export default async function DashboardPage() {
  const user = await requireUser();
  const savedWedding = await getMyWedding(user.id);
  if (!savedWedding) {
    return (
      <main className="dashboard-app setup-dashboard">
        <div className="setup-dashboard-inner">
          <header className="dashboard-topbar">
            <div>
              <span className="eyebrow">Your wedding workspace</span>
              <p>Signed in as {user.email}</p>
            </div>
            <SignOutButton />
          </header>
          <div className="dashboard-welcome">
            <div>
              <span className="eyebrow">Vanakkam, {user.firstName}</span>
              <h1>Let&apos;s set up your wedding</h1>
              <p>Enter the key details below. Your account will be connected as Bride or Groom.</p>
            </div>
            <Link className="button button-outline" href="/w/dinesh-usha">
              View sample website ↗
            </Link>
          </div>
          <WeddingSetupForm />
        </div>
      </main>
    );
  }
  const wedding = toWeddingDto(savedWedding);
  const partnerStatus = await getPartnerStatus(wedding.id, user.id);
  const guestInvitations = await listGuestInvitations(wedding.id, user.id);
  const today = new Intl.DateTimeFormat("en-IN", {
    dateStyle: "full",
    timeZone: "Asia/Kolkata",
  }).format(new Date());
  return (
    <main className="dashboard-app" id="overview">
      <div className="dashboard-layout">
        <aside className="dashboard-sidebar">
          <Brand href="/dashboard" />
          <p className="sidebar-label">Your workspace</p>
          <nav className="sidebar-nav" aria-label="Wedding workspace">
            {workspaceLinks.map(([label, icon, href], index) =>
              index === 0 ? (
                <Link
                  className={index === 0 ? "active" : ""}
                  data-icon={icon}
                  href={href}
                  key={label}
                >
                  {label}
                </Link>
              ) : (
                <span className="nav-disabled" data-icon={icon} key={label}>
                  {label}
                  <span className="coming-soon">Soon</span>
                </span>
              ),
            )}
          </nav>
          <div className="sidebar-bottom">
            <p className="sidebar-label">Account</p>
            <nav className="sidebar-nav" aria-label="Account">
              <SignOutButton />
            </nav>
          </div>
        </aside>

        <section className="dashboard-main">
          <header className="dashboard-topbar">
            <div>
              <span className="eyebrow">Your wedding workspace</span>
              <p>{today}</p>
            </div>
            <div className="avatar" aria-label={user.firstName}>
              {user.firstName.slice(0, 1).toUpperCase()}
            </div>
          </header>
          <div className="dashboard-welcome">
            <div>
              <span className="eyebrow">Vanakkam, {user.firstName}</span>
              <h1>Your wedding, at a glance</h1>
              <p>Your wedding details are saved. Invite your partner to plan together.</p>
            </div>
            <Link
              className="button button-outline"
              href={`/w/${wedding.slug}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              View your website ↗
            </Link>
          </div>

          <section className="dashboard-hero" id="couple" aria-label="Wedding overview">
            <div className="dashboard-hero-copy">
              <span className="eyebrow">Your wedding · {wedding.slug}</span>
              <h2 className="serif">{wedding.title}</h2>
              {(wedding.brideName || wedding.groomName) && (
                <p>{[wedding.brideName, wedding.groomName].filter(Boolean).join(" & ")}</p>
              )}
              <p>
                {new Intl.DateTimeFormat("en-IN", {
                  dateStyle: "full",
                  timeZone: wedding.timezone,
                }).format(new Date(wedding.weddingDate))}{" "}
                · {wedding.venueName}, {wedding.venueAddress}
              </p>
              {wedding.story && <p>{wedding.story}</p>}
              {wedding.mapsUrl && (
                <Link className="button" href={wedding.mapsUrl} target="_blank" rel="noreferrer">
                  Open venue map <span aria-hidden="true">↗</span>
                </Link>
              )}
            </div>
            <Image
              className="dashboard-hero-image"
              src="/images/wedding/stitch-couple.webp"
              alt="A wedding couple"
              width={760}
              height={500}
              priority
            />
          </section>

          <section className="dashboard-stats" aria-label="Wedding summary">
            <article className="stat-card">
              <span>Events planned</span>
              <strong>—</strong>
            </article>
            <article className="stat-card">
              <span>Events in your schedule</span>
              <strong>—</strong>
            </article>
            <article className="stat-card">
              <span>Planning checklist</span>
              <strong>—</strong>
            </article>
          </section>

          <div className="dashboard-columns">
            <section className="dashboard-card" id="events">
              <div className="card-heading">
                <h2>Upcoming events</h2>
                <span className="coming-soon">Coming soon</span>
              </div>
              <p className="workspace-placeholder">
                Your saved wedding details appear above. Add Engagement, Nalangu, Muhurtham, and
                Reception dates when event planning is available.
              </p>
            </section>

            <section className="dashboard-card" id="invitation">
              <div className="card-heading">
                <h2>Quick actions</h2>
              </div>
              <div className="action-list">
                <Link
                  id="website"
                  href={`/w/${wedding.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Wedding website <span aria-hidden="true">↗</span>
                </Link>
                <Link href="/dashboard/wedding/edit">
                  Edit wedding details <span aria-hidden="true">→</span>
                </Link>
                <span className="action-disabled">
                  Preview invitation <small>Coming soon</small>
                </span>
                <CopyWeddingLinkButton slug={wedding.slug} />
              </div>
            </section>
          </div>
          <PartnerInvitePanel weddingId={wedding.id} {...partnerStatus} />
          <GuestInvitationPanel
            weddingId={wedding.id}
            configured={emailDeliveryConfigured()}
            initialInvitations={guestInvitations}
            preview={{
              title: wedding.title,
            }}
          />
        </section>
      </div>
    </main>
  );
}

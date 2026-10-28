import Image from "next/image";
import Link from "next/link";
import { requireUser } from "@/lib/auth/current-user";
import { WeddingSetupForm } from "@/components/shared/wedding-setup-form";
import { CopyWeddingLinkButton } from "@/components/shared/copy-wedding-link-button";
import { getMyWedding } from "@/modules/wedding/wedding.service";
import { toWeddingDto } from "@/modules/wedding/wedding.dto";
import { getPartnerStatus } from "@/modules/partner-invite/partner-invite.service";
import { PartnerInvitePanel } from "@/components/shared/partner-invite-panel";
import { GuestInvitationPanel } from "@/components/shared/guest-invitation-panel";
import { listMemberEvents } from "@/modules/event/event.service";
import { listMemberShoppingItems } from "@/modules/shopping/shopping.service";
import {
  emailDeliveryConfigured,
  listGuestInvitations,
} from "@/modules/guest-invitation/guest-invitation.service";

export default async function DashboardPage() {
  const user = await requireUser();
  const savedWedding = await getMyWedding(user.id);
  if (!savedWedding) {
    return (
      <div className="setup-dashboard-inner">
        <header className="dashboard-topbar">
          <div>
            <span className="eyebrow">Your wedding workspace</span>
            <p>Signed in as {user.email}</p>
          </div>
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
    );
  }
  const wedding = toWeddingDto(savedWedding);
  const [partnerStatus, guestInvitations, events, shoppingItems] = await Promise.all([
    getPartnerStatus(wedding.id, user.id),
    listGuestInvitations(wedding.id, user.id),
    listMemberEvents(wedding.id, user.id),
    listMemberShoppingItems(wedding.id, user.id),
  ]);
  const completedShoppingItems = shoppingItems.filter((item) => item.completed).length;
  const scheduledEvents = events.filter((event) => event.enabled && event.startsAt);
  const requestTime = new Date();
  const upcomingEvents = scheduledEvents
    .filter((event) => new Date(event.startsAt!).getTime() >= requestTime.getTime())
    .sort(
      (left, right) => new Date(left.startsAt!).getTime() - new Date(right.startsAt!).getTime(),
    );
  const today = new Intl.DateTimeFormat("en-IN", {
    dateStyle: "full",
    timeZone: "Asia/Kolkata",
  }).format(new Date());
  return (
    <div id="overview">
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
          <strong>{events.filter((event) => event.startsAt).length}</strong>
        </article>
        <article className="stat-card">
          <span>Events in your schedule</span>
          <strong>{scheduledEvents.length}</strong>
        </article>
        <article className="stat-card">
          <span>Planning checklist</span>
          <strong>
            {completedShoppingItems}/{shoppingItems.length}
          </strong>
          <Link className="text-link" href="/dashboard/shopping">
            Open checklist
          </Link>
        </article>
      </section>

      <div className="dashboard-columns">
        <section className="dashboard-card" id="events">
          <div className="card-heading">
            <h2>Upcoming events</h2>
          </div>
          {upcomingEvents.length ? (
            <ul className="dashboard-event-list">
              {upcomingEvents.map((event) => (
                <li key={event.type}>
                  <strong>{event.title}</strong>
                  <span>
                    {new Intl.DateTimeFormat("en-IN", {
                      dateStyle: "medium",
                      timeStyle: "short",
                      timeZone: "Asia/Kolkata",
                    }).format(new Date(event.startsAt!))}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="workspace-placeholder">No upcoming events are scheduled.</p>
          )}
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
            <Link href="/dashboard/events">
              Wedding events <span aria-hidden="true">→</span>
            </Link>
            <Link href="/dashboard/invitation">
              Edit invitation <span aria-hidden="true">→</span>
            </Link>
            <Link href="/dashboard/shopping">
              Shopping checklist <span aria-hidden="true">→</span>
            </Link>
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
    </div>
  );
}

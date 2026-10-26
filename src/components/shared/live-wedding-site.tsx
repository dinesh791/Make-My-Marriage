import Link from "next/link";
import { Brand } from "@/components/shared/brand";
import type { PublicWeddingDto } from "@/modules/wedding/wedding.dto";
import type { EventDto } from "@/modules/event/event.dto";
import type { InvitationContent } from "@/modules/invitation/invitation.types";
import { TraditionalTamilInvitation } from "./traditional-tamil-invitation";
import { WeddingCountdown } from "./wedding-countdown";

export function LiveWeddingSite({
  wedding,
  unlocked,
  events,
  invitation,
}: {
  wedding: PublicWeddingDto;
  unlocked: boolean;
  events: EventDto[];
  invitation?: InvitationContent;
}) {
  const homeHref = `/w/${wedding.slug}`;
  const coupleNames =
    wedding.brideName && wedding.groomName
      ? `${wedding.brideName} & ${wedding.groomName}`
      : wedding.title;
  const date = new Intl.DateTimeFormat("en-IN", {
    dateStyle: "full",
    timeZone: wedding.timezone,
  }).format(new Date(wedding.weddingDate));

  return (
    <main className="wedding-site live-wedding-site">
      <header className="wedding-nav">
        <div className="wedding-nav-inner">
          <Brand className="wedding-brand" href={homeHref} />
          <nav className="wedding-links" aria-label="Wedding website">
            <a href="#home">Home</a>
            {unlocked && wedding.story && <a href="#our-story">Our Story</a>}
            {events.length > 0 && <a href="#wedding-events">Events</a>}
            <a href="#digital-invitation">Invitation</a>
            {unlocked && <a href="#venue">Venue</a>}
          </nav>
          <Link className="wedding-login" href="/login">
            Login
          </Link>
        </div>
      </header>

      <div className="wedding-blessing-ribbon" aria-label="A wedding blessing">
        <span aria-hidden="true">✦</span>
        <span>With the blessings of our families</span>
        <span aria-hidden="true">✦</span>
      </div>

      <section className="wedding-hero" id="home" aria-labelledby="wedding-title">
        <div className="wedding-hero-glow" aria-hidden="true" />
        <div className="wedding-hero-content">
          <span className="wedding-invocation">A celebration of love</span>
          <p className="wedding-hero-intro">
            Together with our families, we invite you to celebrate
          </p>
          <h1 className="wedding-serif" id="wedding-title">
            {coupleNames}
          </h1>
          <div className="wedding-flourish" aria-hidden="true">
            <span />
            <span>♥</span>
            <span />
          </div>
          {wedding.brideName && wedding.groomName && (
            <p className="wedding-hero-blessing">{wedding.title}</p>
          )}
          <div
            className="wedding-details-card live-wedding-details"
            aria-label="Wedding date and venue"
          >
            <div className="wedding-detail">
              <span className="wedding-detail-icon" aria-hidden="true">
                ◷
              </span>
              <span>
                <small>Date</small>
                <strong>{date}</strong>
              </span>
            </div>
            <div className="wedding-detail">
              <span className="wedding-detail-icon" aria-hidden="true">
                ⌖
              </span>
              <span>
                <small>Venue</small>
                <strong>{wedding.venue.name}</strong>
              </span>
            </div>
          </div>
          <p className="wedding-hero-description">
            We look forward to celebrating this day with the people who mean the most to us.
          </p>
          <div className="wedding-actions">
            <a className="wedding-button" href="#digital-invitation">
              {unlocked ? "View invitation" : "How to view the invitation"}
            </a>
            {unlocked && (
              <a className="wedding-button wedding-button-outline" href="#venue">
                Venue details
              </a>
            )}
          </div>
        </div>
      </section>

      {unlocked && wedding.story && (
        <section className="wedding-section wedding-story" id="our-story">
          <div className="wedding-content">
            <div className="wedding-section-heading">
              <span className="wedding-eyebrow">✦ Our journey ✦</span>
              <h2 className="wedding-serif">Our Story</h2>
            </div>
            <blockquote className="wedding-quote live-story-quote">
              <span className="quote-mark" aria-hidden="true">
                “
              </span>
              <div>
                <p>{wedding.story}</p>
                <cite>— {coupleNames}</cite>
              </div>
            </blockquote>
          </div>
        </section>
      )}

      {unlocked && events.length > 0 && (
        <section className="wedding-section live-events-section" id="wedding-events">
          <div className="wedding-content">
            <div className="wedding-section-heading">
              <span className="wedding-eyebrow">✦ Celebrate with us ✦</span>
              <h2 className="wedding-serif">Wedding Events</h2>
            </div>
            <div className="live-events-grid">
              {events.map((event) => (
                <article className="live-event-card" key={event.type}>
                  <span className="wedding-eyebrow">{event.title}</span>
                  <h3 className="wedding-serif">{event.title}</h3>
                  <p className="live-event-time">
                    {new Intl.DateTimeFormat("en-IN", {
                      dateStyle: "full",
                      timeStyle: "short",
                      timeZone: "Asia/Kolkata",
                    }).format(new Date(event.startsAt!))}
                  </p>
                  {event.venueName && <p>{event.venueName}</p>}
                  {event.address && <p>{event.address}</p>}
                  {event.description && <p>{event.description}</p>}
                  {event.mapsUrl && (
                    <a
                      className="wedding-text-link"
                      href={event.mapsUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
                      View directions <span aria-hidden="true">↗</span>
                    </a>
                  )}
                </article>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="wedding-section wedding-invitation-section" id="digital-invitation">
        <div className="wedding-content">
          <div className="wedding-section-heading">
            <span className="wedding-eyebrow">✦ You are invited ✦</span>
            <h2 className="wedding-serif">A Wedding Invitation</h2>
          </div>
          {unlocked && invitation ? (
            <TraditionalTamilInvitation wedding={wedding} invitation={invitation} events={events} />
          ) : (
            <article className="invitation-card">
              <h3 className="wedding-serif">Invitation details</h3>
              <p className="invitation-message">
                Please open the personal link sent to your email and confirm that you&apos;ll
                attend. The full invitation will appear here afterward.
              </p>
            </article>
          )}
        </div>
      </section>

      {unlocked && (
        <section className="wedding-section" id="venue">
          <div className="wedding-content">
            <div className="wedding-section-heading">
              <span className="wedding-eyebrow">✦ Join us ✦</span>
              <h2 className="wedding-serif">Wedding Venue</h2>
            </div>
            <div className="venue-card live-venue-card">
              <span className="wedding-eyebrow">Where we celebrate</span>
              <h3 className="wedding-serif">{wedding.venue.name}</h3>
              <p className="venue-address">{wedding.venue.address}</p>
              <div className="venue-facts">
                <span>Wedding day</span>
                <span>{date}</span>
              </div>
              {wedding.venue.mapsUrl && (
                <a
                  className="wedding-button"
                  href={wedding.venue.mapsUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  Open in Google Maps <span aria-hidden="true">↗</span>
                </a>
              )}
            </div>
          </div>
        </section>
      )}

      <section className="wedding-countdown-section" aria-labelledby="countdown-title">
        <div className="wedding-content">
          <span className="wedding-eyebrow">Our celebration</span>
          <h2 className="wedding-serif" id="countdown-title">
            Our Wedding Day
          </h2>
          <p>
            {date} · {wedding.venue.name}
          </p>
          <WeddingCountdown targetDate={wedding.weddingDate} label="Countdown to the wedding day" />
        </div>
      </section>

      <footer className="wedding-footer">
        <div className="wedding-footer-inner">
          <div>
            <Brand className="wedding-brand" href={homeHref} />
            <p>Celebrating {coupleNames} with our family and friends.</p>
          </div>
          <div className="footer-quick-links">
            <strong>Quick navigation</strong>
            <a href="#home">Home</a>
            {unlocked && wedding.story && <a href="#our-story">Our story</a>}
            {events.length > 0 && <a href="#wedding-events">Events</a>}
            <a href="#digital-invitation">Invitation</a>
            {unlocked && <a href="#venue">Venue</a>}
          </div>
          <div className="footer-account">
            <strong>Make My Marriage</strong>
            <p>{wedding.title}</p>
            <Link href="/login">Sign in to your account</Link>
          </div>
        </div>
        <div className="wedding-footer-bottom">
          <span>{coupleNames}</span>
          <span>{unlocked ? wedding.venue.address : wedding.venue.name}</span>
        </div>
      </footer>
    </main>
  );
}

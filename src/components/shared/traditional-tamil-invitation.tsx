import type { PublicWeddingDto } from "@/modules/wedding/wedding.dto";
import type { EventDto } from "@/modules/event/event.dto";
import type { InvitationContent } from "@/modules/invitation/invitation.types";

export function TraditionalTamilInvitation({
  wedding,
  invitation,
  events,
}: {
  wedding: PublicWeddingDto;
  invitation: InvitationContent;
  events: EventDto[];
}) {
  const format = (date: string, time = false) =>
    new Intl.DateTimeFormat("en-IN", {
      dateStyle: "full",
      ...(time ? { timeStyle: "short" as const } : {}),
      timeZone: wedding.timezone,
    }).format(new Date(date));
  return (
    <article className="invitation-card tamil-invitation">
      <span className="invitation-emblem" aria-hidden="true">
        ✦
      </span>
      <p lang="ta" className="tamil-invitation-heading">
        திருமண அழைப்பிதழ்
      </p>
      <span className="wedding-eyebrow">With the blessings of our families</span>
      <p className="invitation-message">{invitation.message}</p>
      <h3 className="wedding-serif">
        {wedding.brideName && wedding.groomName
          ? `${wedding.brideName} & ${wedding.groomName}`
          : wedding.title}
      </h3>
      <div className="invitation-divider" aria-hidden="true">
        ✦
      </div>
      <p className="invitation-date">{format(wedding.weddingDate)}</p>
      <p className="invitation-venue">
        {wedding.venue.name}
        <br />
        {wedding.venue.address}
      </p>
      {wedding.venue.mapsUrl && (
        <a
          className="wedding-text-link"
          href={wedding.venue.mapsUrl}
          target="_blank"
          rel="noreferrer"
        >
          View venue directions ↗
        </a>
      )}
      {events.some((event) => event.enabled && event.startsAt) && (
        <ul className="invitation-event-list">
          {events
            .filter((event) => event.enabled && event.startsAt)
            .map((event) => (
              <li key={event.type}>
                <strong>{event.title}</strong>
                <span>{format(event.startsAt!, true)} IST</span>
                {event.endsAt && <span>Ends {format(event.endsAt, true)} IST</span>}
                {event.venueName && <span>{event.venueName}</span>}
                {event.address && <span>{event.address}</span>}
                {event.mapsUrl && (
                  <a
                    className="wedding-text-link"
                    href={event.mapsUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Event directions ↗
                  </a>
                )}
              </li>
            ))}
        </ul>
      )}
      <p className="tamil-invitation-footer">Your presence and blessings mean the world to us.</p>
    </article>
  );
}

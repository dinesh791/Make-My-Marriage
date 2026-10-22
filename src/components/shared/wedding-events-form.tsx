"use client";

import { useRef, useState, type FormEvent } from "react";
import type { EventDto } from "@/modules/event/event.dto";

function dateTimeForInput(value: string | null) {
  if (!value) return "";
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date(value));
  const part = (type: string) => parts.find((item) => item.type === type)?.value ?? "";
  return `${part("year")}-${part("month")}-${part("day")}T${part("hour")}:${part("minute")}`;
}

function EventCard({ weddingId, initialEvent }: { weddingId: string; initialEvent: EventDto }) {
  const submitting = useRef(false);
  const [event, setEvent] = useState(initialEvent);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const fieldId = (field: string) => `${initialEvent.type.toLowerCase()}-${field}`;

  async function submit(formEvent: FormEvent<HTMLFormElement>) {
    formEvent.preventDefault();
    if (submitting.current) return;
    const form = formEvent.currentTarget;
    const fields = new FormData(form);
    const dateTime = String(fields.get("startsAt") ?? "");
    const enabled = fields.get("enabled") === "on";
    if (enabled && !dateTime) {
      setMessage("Add a date and time before showing this event to guests.");
      return;
    }
    submitting.current = true;
    setPending(true);
    setMessage("");
    const text = (name: string) => String(fields.get(name) ?? "").trim() || null;
    try {
      const response = await fetch(`/api/v1/weddings/${weddingId}/events/${event.type}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          startsAt: dateTime ? new Date(`${dateTime}:00+05:30`).toISOString() : null,
          endsAt: null,
          venueName: text("venueName"),
          address: text("address"),
          mapsUrl: text("mapsUrl"),
          description: text("description"),
          enabled,
        }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        setMessage(result.error?.message ?? "Unable to save this event. Please try again.");
        return;
      }
      setEvent(result.data.event);
      setMessage(enabled ? "Saved and visible to attending guests." : "Draft saved.");
    } catch {
      setMessage("We couldn't reach the server. Check your connection and try again.");
    } finally {
      submitting.current = false;
      setPending(false);
    }
  }

  return (
    <form className="event-edit-card" onSubmit={submit} aria-busy={pending}>
      <div className="event-edit-heading">
        <div>
          <span className="eyebrow">Wedding event</span>
          <h2>{event.title}</h2>
        </div>
        <span className={event.enabled ? "event-status is-published" : "event-status"}>
          {event.enabled ? "Visible to guests" : "Draft"}
        </span>
      </div>
      <fieldset className="event-edit-fields" disabled={pending}>
        <div>
          <label className="field-label" htmlFor={fieldId("startsAt")}>
            Date and time
          </label>
          <input
            className="field"
            id={fieldId("startsAt")}
            name="startsAt"
            type="datetime-local"
            defaultValue={dateTimeForInput(event.startsAt)}
          />
          <small>Times are shown in India Standard Time.</small>
        </div>
        <div>
          <label className="field-label" htmlFor={fieldId("venueName")}>
            Venue name
          </label>
          <input
            className="field"
            id={fieldId("venueName")}
            name="venueName"
            maxLength={160}
            defaultValue={event.venueName ?? ""}
          />
        </div>
        <div>
          <label className="field-label" htmlFor={fieldId("address")}>
            Venue address
          </label>
          <input
            className="field"
            id={fieldId("address")}
            name="address"
            maxLength={500}
            defaultValue={event.address ?? ""}
          />
        </div>
        <div>
          <label className="field-label" htmlFor={fieldId("mapsUrl")}>
            Map link
          </label>
          <input
            className="field"
            id={fieldId("mapsUrl")}
            name="mapsUrl"
            type="url"
            maxLength={2000}
            placeholder="https://maps.google.com/..."
            defaultValue={event.mapsUrl ?? ""}
          />
        </div>
        <div className="event-description-field">
          <label className="field-label" htmlFor={fieldId("description")}>
            Description
          </label>
          <textarea
            className="field setup-textarea"
            id={fieldId("description")}
            name="description"
            rows={3}
            maxLength={1000}
            defaultValue={event.description ?? ""}
          />
        </div>
        <label className="event-enable-label">
          <input type="checkbox" name="enabled" defaultChecked={event.enabled} />
          Show this event to attending guests
        </label>
        <div className="event-edit-actions">
          <button className="button" type="submit" disabled={pending}>
            {pending ? "Saving…" : "Save event"}
          </button>
          {message && <p role="status">{message}</p>}
        </div>
      </fieldset>
    </form>
  );
}

export function WeddingEventsForm({
  weddingId,
  events,
}: {
  weddingId: string;
  events: EventDto[];
}) {
  return (
    <div className="event-edit-grid">
      {events.map((event) => (
        <EventCard key={event.type} weddingId={weddingId} initialEvent={event} />
      ))}
    </div>
  );
}

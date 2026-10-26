"use client";

import { useRef, useState, type FormEvent, type MouseEvent } from "react";
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

function eventPayload(fields: FormData, title?: string) {
  const dateTime = String(fields.get("startsAt") ?? "");
  const text = (name: string) => String(fields.get(name) ?? "").trim() || null;
  return {
    ...(title === undefined ? {} : { title }),
    startsAt: dateTime ? new Date(`${dateTime}:00+05:30`).toISOString() : null,
    endsAt: null,
    venueName: text("venueName"),
    address: text("address"),
    mapsUrl: text("mapsUrl"),
    description: text("description"),
    enabled: fields.get("enabled") === "on",
  };
}

function EventCard({
  weddingId,
  initialEvent,
  onSaved,
  onDeleted,
}: {
  weddingId: string;
  initialEvent: EventDto;
  onSaved: (event: EventDto) => void;
  onDeleted: (event: EventDto) => void;
}) {
  const submitting = useRef(false);
  const [event, setEvent] = useState(initialEvent);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const [editing, setEditing] = useState(false);
  const [editVersion, setEditVersion] = useState(0);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const custom = event.type.startsWith("CUSTOM_");
  const fieldId = (field: string) =>
    `${initialEvent.id || initialEvent.type.toLowerCase()}-${field}`;

  async function submit(formEvent: FormEvent<HTMLFormElement>) {
    formEvent.preventDefault();
    if (submitting.current) return;
    const fields = new FormData(formEvent.currentTarget);
    const enabled = fields.get("enabled") === "on";
    if (enabled && !String(fields.get("startsAt") ?? "")) {
      setMessage("Add a date and time before showing this event to guests.");
      return;
    }
    submitting.current = true;
    setPending(true);
    setMessage("");
    const title = String(fields.get("title") ?? "").trim();
    if (custom && !title) {
      setMessage("Add an event name.");
      submitting.current = false;
      setPending(false);
      return;
    }
    try {
      const response = await fetch(
        custom
          ? `/api/v1/weddings/${weddingId}/events/custom/${event.id}`
          : `/api/v1/weddings/${weddingId}/events/${event.type}`,
        {
          method: custom ? "PATCH" : "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "same-origin",
          body: JSON.stringify(eventPayload(fields, custom ? title : undefined)),
        },
      );
      const result = await response.json().catch(() => null);
      if (!result) {
        setMessage("The server returned an unexpected response. Refresh the page and try again.");
        return;
      }
      if (!response.ok || !result.success || !result.data?.event) {
        setMessage(result.error?.message ?? "Unable to save this event. Please try again.");
        return;
      }
      setEvent(result.data.event);
      onSaved(result.data.event);
      setMessage(enabled ? "Saved and visible to attending guests." : "Draft saved.");
      setEditing(false);
      setEditVersion((current) => current + 1);
    } catch {
      setMessage("We couldn't reach the server. Check your connection and try again.");
    } finally {
      submitting.current = false;
      setPending(false);
    }
  }

  async function deleteEvent() {
    if (deleting) return;
    setDeleting(true);
    setMessage("");
    try {
      const response = await fetch(
        custom
          ? `/api/v1/weddings/${weddingId}/events/custom/${event.id}`
          : `/api/v1/weddings/${weddingId}/events/${event.type}`,
        {
          method: "DELETE",
          credentials: "same-origin",
        },
      );
      const result = await response.json().catch(() => null);
      if (!result) {
        setMessage("The server returned an unexpected response. Refresh the page and try again.");
        return;
      }
      if (!response.ok || !result.success) {
        setMessage(result.error?.message ?? "Unable to delete this event. Please try again.");
        return;
      }
      onDeleted(event);
    } catch {
      setMessage("We couldn't reach the server. Check your connection and try again.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <form className="event-edit-card" onSubmit={submit} aria-busy={pending}>
      <div className="event-edit-heading">
        <div>
          <span className="eyebrow">{custom ? "Custom wedding event" : "Wedding event"}</span>
          <h2>{event.title}</h2>
        </div>
        <span className={event.enabled ? "event-status is-published" : "event-status"}>
          {event.enabled ? "Visible to guests" : "Draft"}
        </span>
      </div>
      {!editing && (
        <div className="event-card-summary">
          {event.startsAt ? (
            <p>
              <strong>Date and time:</strong>{" "}
              {new Intl.DateTimeFormat("en-IN", {
                dateStyle: "medium",
                timeStyle: "short",
                timeZone: "Asia/Kolkata",
              }).format(new Date(event.startsAt))}
            </p>
          ) : (
            <p>No date and time added yet.</p>
          )}
          {event.venueName && (
            <p>
              <strong>Venue:</strong> {event.venueName}
            </p>
          )}
          {event.address && (
            <p>
              <strong>Address:</strong> {event.address}
            </p>
          )}
          {event.description && <p>{event.description}</p>}
          {event.mapsUrl && (
            <a href={event.mapsUrl} target="_blank" rel="noreferrer">
              View map
            </a>
          )}
        </div>
      )}
      {!editing && (
        <div className="event-card-actions">
          <button
            className="event-icon-button"
            type="button"
            aria-label={`Edit ${event.title}`}
            title={`Edit ${event.title}`}
            onClick={() => {
              setMessage("");
              setConfirmDelete(false);
              setEditing(true);
            }}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M12 20h9" />
              <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L9 17l-4 1 1-4Z" />
            </svg>
          </button>
          <button
            className="event-icon-button event-delete-button"
            type="button"
            aria-label={`Delete ${event.title}`}
            title={`Delete ${event.title}`}
            onClick={() => {
              setMessage("");
              setConfirmDelete(true);
            }}
            disabled={deleting}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M3 6h18" />
              <path d="M8 6V4h8v2" />
              <path d="M5 6l1 14h12l1-14" />
              <path d="M10 10v6M14 10v6" />
            </svg>
          </button>
          {message && <p role="status">{message}</p>}
        </div>
      )}
      {!editing && confirmDelete && (
        <div
          className="event-delete-confirmation"
          role="group"
          aria-label={`Delete ${event.title}`}
        >
          <p>
            Delete {event.title}? It will disappear from your event cards and the wedding page. You
            can add it again later as a new event.
          </p>
          <div>
            <button
              className="button button-secondary"
              type="button"
              disabled={deleting}
              onClick={() => setConfirmDelete(false)}
            >
              Cancel
            </button>
            <button
              className="button event-delete-confirm"
              type="button"
              disabled={deleting}
              onClick={deleteEvent}
            >
              {deleting ? "Deleting…" : "Delete event"}
            </button>
          </div>
        </div>
      )}
      {editing && (
        <fieldset key={editVersion} className="event-edit-fields" disabled={pending}>
          {custom && (
            <div className="event-description-field">
              <label className="field-label" htmlFor={fieldId("title")}>
                Event name
              </label>
              <input
                className="field"
                id={fieldId("title")}
                name="title"
                maxLength={120}
                defaultValue={event.title}
                required
              />
            </div>
          )}
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
              {pending ? "Saving…" : "Save changes"}
            </button>
            <button
              className="button button-secondary"
              type="button"
              disabled={pending}
              onClick={() => {
                setEditing(false);
                setMessage("");
                setEditVersion((current) => current + 1);
              }}
            >
              Cancel
            </button>
            {message && <p role="status">{message}</p>}
          </div>
        </fieldset>
      )}
    </form>
  );
}

function AddEventDialog({
  weddingId,
  onClose,
  onCreated,
}: {
  weddingId: string;
  onClose: () => void;
  onCreated: (event: EventDto) => void;
}) {
  const submitting = useRef(false);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");

  async function submit(formEvent: FormEvent<HTMLFormElement>) {
    formEvent.preventDefault();
    if (submitting.current) return;
    const fields = new FormData(formEvent.currentTarget);
    const title = String(fields.get("title") ?? "").trim();
    if (!title) {
      setMessage("Enter an event name.");
      return;
    }
    if (fields.get("enabled") === "on" && !String(fields.get("startsAt") ?? "")) {
      setMessage("Add a date and time before showing this event to guests.");
      return;
    }
    submitting.current = true;
    setPending(true);
    setMessage("");
    try {
      const response = await fetch(`/api/v1/weddings/${weddingId}/events`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify(eventPayload(fields, title)),
      });
      const result = await response.json().catch(() => null);
      if (!result) {
        setMessage("The server returned an unexpected response. Refresh the page and try again.");
        return;
      }
      if (!response.ok || !result.success || !result.data?.event) {
        setMessage(result.error?.message ?? "Unable to add this event. Please try again.");
        return;
      }
      onCreated(result.data.event);
      onClose();
    } catch {
      setMessage("We couldn't reach the server. Check your connection and try again.");
    } finally {
      submitting.current = false;
      setPending(false);
    }
  }

  function handleBackdrop(event: MouseEvent<HTMLDivElement>) {
    if (event.target === event.currentTarget && !pending) onClose();
  }

  return (
    <div
      className="event-modal-backdrop"
      onMouseDown={handleBackdrop}
      onKeyDown={(event) => {
        if (event.key === "Escape" && !pending) onClose();
      }}
    >
      <section
        className="event-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-event-title"
        tabIndex={-1}
      >
        <div className="event-modal-heading">
          <div>
            <span className="eyebrow">Wedding events</span>
            <h2 id="add-event-title">Add wedding event</h2>
            <p>Add the details now. You can save a draft or show the event to attending guests.</p>
          </div>
          <button
            className="event-modal-close"
            type="button"
            aria-label="Close"
            onClick={onClose}
            disabled={pending}
          >
            ×
          </button>
        </div>
        <form className="event-modal-form" onSubmit={submit} aria-busy={pending}>
          <label>
            Event name <span aria-hidden="true">*</span>
            <input
              className="field"
              name="title"
              maxLength={120}
              placeholder="For example, Mehendi"
              required
              autoFocus
            />
          </label>
          <label>
            Date and time
            <input className="field" name="startsAt" type="datetime-local" />
          </label>
          <label>
            Venue name
            <input className="field" name="venueName" maxLength={160} />
          </label>
          <label>
            Venue address
            <input className="field" name="address" maxLength={500} />
          </label>
          <label>
            Map link
            <input
              className="field"
              name="mapsUrl"
              type="url"
              maxLength={2000}
              placeholder="https://maps.google.com/..."
            />
          </label>
          <label>
            Description
            <textarea
              className="field setup-textarea"
              name="description"
              rows={3}
              maxLength={1000}
            />
          </label>
          <label className="event-modal-enable-label">
            <input type="checkbox" name="enabled" />
            Show this event to attending guests
          </label>
          <p className="event-modal-timezone">Times are shown in India Standard Time.</p>
          {message && (
            <p className="event-modal-error" role="alert">
              {message}
            </p>
          )}
          <div className="event-modal-actions">
            <button
              className="button button-secondary"
              type="button"
              onClick={onClose}
              disabled={pending}
            >
              Cancel
            </button>
            <button className="button" type="submit" disabled={pending}>
              {pending ? "Adding…" : "Add event"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

export function WeddingEventsForm({
  weddingId,
  events,
}: {
  weddingId: string;
  events: EventDto[];
}) {
  const [items, setItems] = useState(events);
  const [dialogOpen, setDialogOpen] = useState(false);
  const syncEvent = (updated: EventDto) =>
    setItems((current) => {
      const index = current.findIndex(
        (item) => item.id === updated.id || item.type === updated.type,
      );
      if (index < 0) return [...current, updated];
      return current.map((item, itemIndex) => (itemIndex === index ? updated : item));
    });
  const removeEvent = (deleted: EventDto) =>
    setItems((current) => current.filter((event) => event.type !== deleted.type));

  return (
    <>
      <div className="event-section-heading event-page-heading">
        <div>
          <span className="eyebrow">Your wedding workspace</span>
          <h1>Wedding events</h1>
          <p>
            Plan Engagement, Nalangu, Muhurtham, Reception, and any other celebrations. New events
            start as drafts; enabled events with a date and time appear to attending guests.
          </p>
          <p>Your main wedding date and countdown are edited separately in Wedding details.</p>
        </div>
        <button className="button" type="button" onClick={() => setDialogOpen(true)}>
          + Add Event
        </button>
      </div>
      <div className="event-edit-grid">
        {items.map((event) => (
          <EventCard
            key={event.id || event.type}
            weddingId={weddingId}
            initialEvent={event}
            onSaved={syncEvent}
            onDeleted={removeEvent}
          />
        ))}
      </div>
      {dialogOpen && (
        <AddEventDialog
          weddingId={weddingId}
          onClose={() => setDialogOpen(false)}
          onCreated={syncEvent}
        />
      )}
    </>
  );
}

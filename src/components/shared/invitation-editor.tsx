"use client";
import { useState } from "react";
import Link from "next/link";
import type { PublicWeddingDto } from "@/modules/wedding/wedding.dto";
import type { EventDto } from "@/modules/event/event.dto";
import type { InvitationDraft } from "@/modules/invitation/invitation.types";
import { TraditionalTamilInvitation } from "./traditional-tamil-invitation";

export function InvitationEditor({
  weddingId,
  wedding,
  invitation,
  events,
}: {
  weddingId: string;
  wedding: PublicWeddingDto;
  invitation: InvitationDraft;
  events: EventDto[];
}) {
  const [saved, setSaved] = useState(invitation);
  const [message, setMessage] = useState(invitation.message);
  const [pending, setPending] = useState(false);
  const [notice, setNotice] = useState("");
  const [conflict, setConflict] = useState(false);
  const dirty = message.trim() !== saved.message;
  async function submit(publish: boolean) {
    setPending(true);
    setNotice("");
    try {
      const response = await fetch(
        `/api/v1/weddings/${weddingId}/invitation${publish ? "/publish" : ""}`,
        {
          method: publish ? "POST" : "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(
            publish ? { revision: saved.revision } : { message, revision: saved.revision },
          ),
        },
      );
      const body = await response.json();
      if (!response.ok || !body.success) {
        setConflict(response.status === 409);
        setNotice(body.error?.message ?? "Unable to save your invitation. Please try again.");
        return;
      }
      setSaved(body.data.invitation);
      setMessage(body.data.invitation.message);
      setNotice(
        publish
          ? "Published. Attending guests can now see this invitation."
          : "Draft saved. Click Publish when you are ready to share it.",
      );
    } catch {
      setNotice("We couldn't reach the server. Please try again.");
    } finally {
      setPending(false);
    }
  }
  return (
    <div className="invitation-editor-grid">
      <section
        className="dashboard-card invitation-editor-controls"
        aria-labelledby="invitation-edit-heading"
      >
        <span className="eyebrow">Traditional Tamil</span>
        <h2 id="invitation-edit-heading">Make it personal</h2>
        <p>
          {saved.publishedAt
            ? saved.revision === saved.publishedRevision
              ? "Your saved invitation is published."
              : "You have an unpublished draft."
            : "The default invitation is visible until you publish your first draft."}
        </p>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            void submit(false);
          }}
        >
          <label htmlFor="invitation-message">Welcome message</label>
          <textarea
            id="invitation-message"
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            required
            maxLength={1000}
            rows={8}
            disabled={pending}
            aria-describedby="invitation-message-help"
          />
          <small id="invitation-message-help">{message.length}/1000 characters · Plain text</small>
          <div className="invitation-editor-actions">
            <button
              className="button button-outline"
              type="submit"
              disabled={pending || conflict || !message.trim() || (!dirty && saved.revision > 0)}
            >
              Save draft
            </button>
            <button
              className="button"
              type="button"
              onClick={() => void submit(true)}
              disabled={
                pending ||
                conflict ||
                dirty ||
                saved.revision === 0 ||
                saved.revision === saved.publishedRevision
              }
            >
              Publish
            </button>
          </div>
          {dirty && <p>Unsaved changes. Save your draft before publishing.</p>}
          {pending && <p role="status">Saving…</p>}
          <p role="status" aria-live="polite">
            {notice}
          </p>
          {conflict && (
            <a className="text-link" href="/dashboard/invitation">
              Reload the latest draft
            </a>
          )}
        </form>
        <p>
          Names, wedding date, venue and enabled events use your saved wedding details. Changes to
          those details appear separately from publishing this message.
        </p>
        <p>
          <Link href="/dashboard/wedding/edit">Edit wedding details</Link> ·{" "}
          <Link href="/dashboard/events">Manage events</Link>
        </p>
        <Link
          className="text-link"
          href={`/w/${wedding.slug}#digital-invitation`}
          target="_blank"
          rel="noreferrer"
        >
          View published invitation ↗
        </Link>
      </section>
      <section className="invitation-editor-preview" aria-label="Draft invitation preview">
        <div className="invitation-preview-label">
          <strong>Draft preview</strong>
          <span>Only you and your partner can see this draft.</span>
        </div>
        <TraditionalTamilInvitation
          wedding={wedding}
          invitation={{ ...saved, message }}
          events={events}
        />
      </section>
    </div>
  );
}

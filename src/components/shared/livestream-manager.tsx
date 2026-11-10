"use client";
import { useState, type FormEvent } from "react";
import type { LivestreamInput } from "@/modules/livestream/livestream.validators";

const blank: LivestreamInput = { title: "Watch our wedding live", playbackUrl: "", enabled: false };
export function LivestreamManager({
  weddingId,
  initial,
}: {
  weddingId: string;
  initial: LivestreamInput | null;
}) {
  const [saved, setSaved] = useState(initial);
  const [draft, setDraft] = useState(initial ?? blank);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  async function save(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch(`/api/v1/weddings/${weddingId}/livestream`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      });
      const result = await response.json();
      if (!response.ok || !result.success)
        throw new Error(result.error?.message ?? "Could not save the livestream.");
      setSaved(result.data.livestream);
      setMessage("Livestream settings saved.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not reach the server.");
    } finally {
      setBusy(false);
    }
  }
  async function remove() {
    if (!window.confirm("Remove this livestream link?")) return;
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch(`/api/v1/weddings/${weddingId}/livestream`, {
        method: "DELETE",
      });
      const result = await response.json();
      if (!response.ok || !result.success)
        throw new Error(result.error?.message ?? "Could not remove the livestream.");
      setSaved(null);
      setDraft(blank);
      setMessage("Livestream link removed.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not reach the server.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="livestream-workspace">
      <span className="eyebrow">Wedding workspace</span>
      <h1>Livestream</h1>
      <p>
        Add a viewing link from YouTube or another streaming service. Only you and guests who choose
        to attend or watch online can see it on your wedding website. Anyone given the external link
        can share it.
      </p>
      {message && <p role="status">{message}</p>}
      <form onSubmit={save} className="catering-editor">
        <label>
          Display title
          <input
            required
            maxLength={120}
            disabled={busy}
            value={draft.title}
            onChange={(event) => setDraft({ ...draft, title: event.target.value })}
          />
        </label>
        <label>
          Secure viewing link
          <input
            required
            type="url"
            pattern="https://.*"
            placeholder="https://www.youtube.com/watch?v=..."
            maxLength={2000}
            disabled={busy}
            value={draft.playbackUrl}
            onChange={(event) => setDraft({ ...draft, playbackUrl: event.target.value })}
          />
        </label>
        <label className="livestream-switch">
          <input
            type="checkbox"
            disabled={busy}
            checked={draft.enabled}
            onChange={(event) => setDraft({ ...draft, enabled: event.target.checked })}
          />
          <span>Show Watch live on the wedding website</span>
        </label>
        <p className="livestream-help">
          Keep this off until the viewing link is ready. You can change or hide it at any time.
        </p>
        <div className="catering-actions">
          {saved && (
            <button type="button" className="button-secondary" disabled={busy} onClick={remove}>
              Remove link
            </button>
          )}
          <button className="button-primary" disabled={busy}>
            {busy ? "Saving…" : "Save livestream"}
          </button>
        </div>
      </form>
      {saved && (
        <p className="livestream-help">
          Current status:{" "}
          {saved.enabled ? "Visible to attending and online guests" : "Hidden from guests"}
        </p>
      )}
    </section>
  );
}

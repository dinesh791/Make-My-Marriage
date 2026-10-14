"use client";

import { useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

export function WeddingSetupForm() {
  const router = useRouter();
  const submitting = useRef(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting.current) return;
    submitting.current = true;
    setPending(true);
    setError("");
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/v1/weddings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          title: form.get("title"),
          role: form.get("role"),
          weddingDate: new Date(`${form.get("weddingDate")}T00:00:00+05:30`).toISOString(),
          venueName: form.get("venueName"),
          venueAddress: form.get("venueAddress"),
          story: form.get("story"),
          mapsUrl: form.get("mapsUrl"),
        }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        setError(result.error?.message ?? "Unable to save your wedding. Please try again.");
        return;
      }
      router.refresh();
    } catch {
      setError("We couldn't reach the server. Check your connection and try again.");
    } finally {
      submitting.current = false;
      setPending(false);
    }
  }

  return (
    <section className="setup-card">
      <span className="eyebrow">Your first step</span>
      <h2>Create your wedding</h2>
      <p>Save the basic details now. You can invite your partner after setup.</p>
      <form className="auth-form setup-form" onSubmit={submit} aria-busy={pending}>
        <fieldset className="auth-fields" disabled={pending}>
          <div>
            <label className="field-label" htmlFor="role">
              I am the
            </label>
            <select className="field" id="role" name="role" defaultValue="BRIDE" required>
              <option value="BRIDE">Bride</option>
              <option value="GROOM">Groom</option>
            </select>
          </div>
          <div>
            <label className="field-label" htmlFor="title">
              Wedding title
            </label>
            <input
              className="field"
              id="title"
              name="title"
              placeholder="e.g. Dinesh & Usha Wedding"
              maxLength={120}
              minLength={3}
              required
            />
          </div>
          <div className="setup-grid">
            <div>
              <label className="field-label" htmlFor="weddingDate">
                Wedding date
              </label>
              <input className="field" id="weddingDate" name="weddingDate" type="date" required />
            </div>
            <div>
              <label className="field-label" htmlFor="venueName">
                Venue name
              </label>
              <input className="field" id="venueName" name="venueName" maxLength={160} required />
            </div>
          </div>
          <div>
            <label className="field-label" htmlFor="venueAddress">
              Venue address
            </label>
            <input
              className="field"
              id="venueAddress"
              name="venueAddress"
              placeholder="Town or full address"
              maxLength={500}
              required
            />
          </div>
          <div>
            <label className="field-label" htmlFor="story">
              A short story (optional)
            </label>
            <textarea
              className="field setup-textarea"
              id="story"
              name="story"
              rows={3}
              maxLength={2000}
            />
          </div>
          <div>
            <label className="field-label" htmlFor="mapsUrl">
              Google Maps link (optional)
            </label>
            <input
              className="field"
              id="mapsUrl"
              name="mapsUrl"
              type="url"
              placeholder="https://maps.google.com/..."
              maxLength={2000}
            />
          </div>
          {error && (
            <p className="auth-error" role="alert">
              {error}
            </p>
          )}
          <button className="button auth-submit" type="submit" disabled={pending}>
            {pending ? "Saving wedding…" : "Create wedding"}
          </button>
        </fieldset>
      </form>
    </section>
  );
}

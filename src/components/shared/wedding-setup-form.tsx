"use client";

import { useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { WeddingDetailsFields, weddingDetailsFromForm } from "./wedding-details-fields";

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
          ...weddingDetailsFromForm(form),
          role: form.get("role"),
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
          <WeddingDetailsFields />
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

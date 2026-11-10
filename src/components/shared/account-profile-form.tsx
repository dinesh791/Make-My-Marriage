"use client";

import { useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

export function AccountProfileForm({
  firstName,
  lastName,
  email,
}: {
  firstName: string;
  lastName: string;
  email: string;
}) {
  const router = useRouter();
  const submitting = useRef(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting.current) return;
    submitting.current = true;
    setPending(true);
    setError("");
    setSaved("");
    const form = new FormData(event.currentTarget);
    const submittedEmail = String(form.get("email") ?? "")
      .trim()
      .toLowerCase();
    const emailChanged = submittedEmail !== email.toLowerCase();
    const currentPassword = String(form.get("currentPassword") ?? "");
    if (emailChanged && !currentPassword) {
      setError("Enter your current password to change your email address.");
      submitting.current = false;
      setPending(false);
      return;
    }
    try {
      const response = await fetch("/api/v1/users/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          firstName: form.get("firstName"),
          lastName: form.get("lastName"),
          email: submittedEmail,
          ...(emailChanged ? { currentPassword } : {}),
        }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        setError(result.error?.message ?? "Unable to save your details. Please try again.");
        return;
      }
      setSaved(result.message ?? "Your account details are saved.");
      router.refresh();
    } catch {
      setError("We couldn't reach the server. Check your connection and try again.");
    } finally {
      submitting.current = false;
      setPending(false);
    }
  }

  return (
    <form className="account-profile-card" onSubmit={submit} aria-busy={pending}>
      <div className="account-profile-fields">
        <div>
          <label className="field-label" htmlFor="account-first-name">
            First name
          </label>
          <input
            className="field"
            id="account-first-name"
            name="firstName"
            defaultValue={firstName}
            maxLength={100}
            required
          />
        </div>
        <div>
          <label className="field-label" htmlFor="account-last-name">
            Last name
          </label>
          <input
            className="field"
            id="account-last-name"
            name="lastName"
            defaultValue={lastName}
            maxLength={100}
          />
        </div>
        <div>
          <label className="field-label" htmlFor="account-email-address">
            Email address
          </label>
          <input
            className="field"
            id="account-email-address"
            name="email"
            type="email"
            autoComplete="email"
            defaultValue={email}
            maxLength={254}
            required
          />
          <p className="field-hint">
            Changes take effect immediately without confirmation. Use an address you can access for
            future account recovery.
          </p>
        </div>
        <div>
          <label className="field-label" htmlFor="account-current-password">
            Current password{" "}
            <span className="field-hint-inline">(only needed to change email)</span>
          </label>
          <input
            className="field"
            id="account-current-password"
            name="currentPassword"
            type="password"
            autoComplete="current-password"
            maxLength={128}
          />
        </div>
      </div>
      {error && (
        <p className="auth-error" role="alert">
          {error}
        </p>
      )}
      {saved && (
        <p className="account-success" role="status">
          {saved}
        </p>
      )}
      <button className="button" type="submit" disabled={pending}>
        {pending ? "Saving…" : "Save account details"}
      </button>
    </form>
  );
}

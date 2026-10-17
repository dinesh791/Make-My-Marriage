"use client";

import { useRef, useState } from "react";

export function PartnerInvitePanel({
  weddingId,
  targetRole,
  joined,
}: {
  weddingId: string;
  targetRole: "BRIDE" | "GROOM";
  joined: boolean;
}) {
  const submitting = useRef(false);
  const [pending, setPending] = useState(false);
  const [link, setLink] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [message, setMessage] = useState("");

  async function create() {
    if (submitting.current) return;
    submitting.current = true;
    setPending(true);
    setMessage("");
    try {
      const response = await fetch(`/api/v1/weddings/${weddingId}/partner-invites`, {
        method: "POST",
        credentials: "same-origin",
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        setMessage(result.error?.message ?? "Unable to create the invitation.");
        return;
      }
      setLink(`${window.location.origin}/partner-invite/${result.data.token}`);
      setExpiresAt(result.data.expiresAt);
    } catch {
      setMessage("We couldn't reach the server. Please try again.");
    } finally {
      submitting.current = false;
      setPending(false);
    }
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(link);
      setMessage("Invitation link copied. Share it privately with your partner.");
    } catch {
      setMessage("Copy the invitation link from the field above.");
    }
  }

  return (
    <section className="dashboard-card partner-invite-card" aria-labelledby="partner-invite-title">
      <div className="card-heading">
        <h2 id="partner-invite-title">Invite your partner</h2>
      </div>
      {joined ? (
        <p>
          Your partner has joined as {targetRole === "BRIDE" ? "Bride" : "Groom"}. You can both
          manage this wedding.
        </p>
      ) : (
        <>
          <p>
            Send one private link to your partner to join as{" "}
            {targetRole === "BRIDE" ? "Bride" : "Groom"}.
          </p>
          <button className="button" type="button" onClick={create} disabled={pending}>
            {pending ? "Creating link…" : link ? "Create a new link" : "Create partner link"}
          </button>
          {link && (
            <div className="partner-invite-link">
              <label className="field-label" htmlFor="partner-link">
                Partner invitation link
              </label>
              <input
                className="field"
                id="partner-link"
                value={link}
                readOnly
                onFocus={(event) => event.currentTarget.select()}
              />
              <button className="button button-outline" type="button" onClick={copy}>
                Copy link
              </button>
              <p className="field-hint">
                Expires{" "}
                {new Intl.DateTimeFormat("en-IN", {
                  dateStyle: "medium",
                  timeStyle: "short",
                  timeZone: "Asia/Kolkata",
                }).format(new Date(expiresAt))}
                . Creating a new link revokes the old one.
              </p>
            </div>
          )}
          <p className="field-hint">
            The link is shown only when created. Keep it private. Your partner will sign in or
            create an account to accept it.
          </p>
        </>
      )}
      {message && (
        <p className="field-hint" role="status">
          {message}
        </p>
      )}
    </section>
  );
}

"use client";

import { useRef, useState, type FormEvent } from "react";

type GuestInvitation = {
  id: string;
  recipientEmail: string;
  sendStatus: "PENDING" | "SENT" | "FAILED";
  response: "PENDING" | "ATTENDING" | "DECLINED";
  sentAt: string | null;
  respondedAt: string | null;
};

export function GuestInvitationPanel({
  weddingId,
  configured,
  initialInvitations,
  preview,
}: {
  weddingId: string;
  configured: boolean;
  initialInvitations: GuestInvitation[];
  preview: { title: string };
}) {
  const sending = useRef(false);
  const [pending, setPending] = useState(false);
  const [invitations, setInvitations] = useState(initialInvitations);
  const [message, setMessage] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (sending.current) return;
    sending.current = true;
    setPending(true);
    setMessage("");
    const form = event.currentTarget;
    const recipients = String(new FormData(form).get("recipients") ?? "")
      .split(/[\n,;]+/)
      .map((email) => email.trim())
      .filter(Boolean);
    try {
      const response = await fetch(`/api/v1/weddings/${weddingId}/invitation/emails`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ recipients }),
      });
      const body = await response.json();
      if (!response.ok || !body.success) {
        setMessage(body.error?.message ?? "Unable to send invitations.");
        return;
      }
      setMessage(
        body.data.results
          .map(
            (item: { recipientEmail: string; status: string }) =>
              `${item.recipientEmail}: ${item.status.toLowerCase().replaceAll("_", " ")}`,
          )
          .join(" · "),
      );
      const listResponse = await fetch(`/api/v1/weddings/${weddingId}/invitation/emails`, {
        credentials: "same-origin",
        cache: "no-store",
      });
      const list = await listResponse.json();
      if (listResponse.ok && list.success) setInvitations(list.data.invitations);
      if (body.data.results.every((item: { status: string }) => item.status === "SENT"))
        form.reset();
    } catch {
      setMessage("We couldn't reach the server. Please try again.");
    } finally {
      sending.current = false;
      setPending(false);
    }
  }

  return (
    <section
      className="dashboard-card guest-invitation-card"
      aria-labelledby="guest-invitation-title"
    >
      <div className="card-heading">
        <h2 id="guest-invitation-title">Email invitations to relatives</h2>
      </div>
      <p>
        Send a personal invitation by email. Relatives can confirm attendance and then open the full
        wedding invitation without creating an account.
      </p>
      <div className="guest-email-preview">
        <span className="eyebrow">Email preview</span>
        <h3>{preview.title}</h3>
        <p>You are warmly invited to celebrate with us.</p>
        <p>
          Please tell us whether you can attend to open the full wedding invitation and venue
          details.
        </p>
        <span className="button" aria-hidden="true">
          Respond to invitation
        </span>
      </div>
      {configured ? (
        <form onSubmit={submit} className="guest-invitation-form">
          <label className="field-label" htmlFor="guest-emails">
            Recipient email addresses
          </label>
          <textarea
            className="field setup-textarea"
            id="guest-emails"
            name="recipients"
            placeholder="relative1@example.com, relative2@example.com"
            required
            aria-describedby="guest-email-hint"
          />
          <p className="field-hint" id="guest-email-hint">
            Enter up to 10 addresses, separated by commas or new lines. Review them before sending.
          </p>
          <button className="button" type="submit" disabled={pending}>
            {pending ? "Sending…" : "Send invitations"}
          </button>
        </form>
      ) : (
        <p className="field-hint">
          Email delivery is not configured yet. Set RESEND_API_KEY and EMAIL_FROM on the server to
          send invitations.
        </p>
      )}
      {message && (
        <p className="field-hint" role="status">
          {message}
        </p>
      )}
      {invitations.length > 0 && (
        <div className="guest-invitation-history">
          <h3>Responses</h3>
          <ul>
            {invitations.map((item) => (
              <li key={item.id}>
                <span>{item.recipientEmail}</span>
                <span>
                  {item.sendStatus === "SENT"
                    ? item.response === "PENDING"
                      ? "Awaiting response"
                      : item.response === "ATTENDING"
                        ? "Attending"
                        : "Can’t attend"
                    : item.sendStatus === "FAILED"
                      ? "Delivery failed"
                      : "Sending"}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

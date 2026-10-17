"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

export function GuestRsvpForm({
  token,
  response,
}: {
  token: string;
  response: "PENDING" | "ATTENDING" | "DECLINED";
}) {
  const router = useRouter();
  const submitting = useRef(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function respond(answer: "ATTENDING" | "DECLINED") {
    if (submitting.current) return;
    submitting.current = true;
    setPending(true);
    setError("");
    try {
      const result = await fetch(`/api/v1/guest-invitations/${token}/respond`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ response: answer }),
      });
      const body = await result.json();
      if (!result.ok || !body.success) {
        setError(body.error?.message ?? "We couldn't record your response.");
        return;
      }
      if (answer === "ATTENDING") router.replace(`/w/${body.data.slug}`);
      else router.refresh();
    } catch {
      setError("We couldn't reach the server. Please try again.");
    } finally {
      submitting.current = false;
      setPending(false);
    }
  }

  if (response === "DECLINED") return <p>Thank you for letting the couple know.</p>;
  return (
    <div className="guest-rsvp-actions">
      <button
        className="button"
        type="button"
        disabled={pending}
        onClick={() => respond("ATTENDING")}
      >
        {pending
          ? "Saving…"
          : response === "ATTENDING"
            ? "Open full invitation"
            : "I'll attend · View invitation"}
      </button>
      {response === "PENDING" && (
        <button
          className="button button-outline"
          type="button"
          disabled={pending}
          onClick={() => respond("DECLINED")}
        >
          I can&apos;t attend
        </button>
      )}
      {error && (
        <p className="auth-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

export function AcceptPartnerInviteButton({ token }: { token: string }) {
  const router = useRouter();
  const submitting = useRef(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function accept() {
    if (submitting.current) return;
    submitting.current = true;
    setPending(true);
    setError("");
    try {
      const response = await fetch(`/api/v1/wedding-partner-invites/${token}/accept`, {
        method: "POST",
        credentials: "same-origin",
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        setError(result.error?.message ?? "Unable to join this wedding.");
        return;
      }
      router.replace("/dashboard");
      router.refresh();
    } catch {
      setError("We couldn't reach the server. Please try again.");
    } finally {
      submitting.current = false;
      setPending(false);
    }
  }

  return (
    <>
      <button className="button" type="button" onClick={accept} disabled={pending}>
        {pending ? "Joining wedding…" : "Accept invitation"}
      </button>
      {error && (
        <p className="auth-error" role="alert">
          {error}
        </p>
      )}
    </>
  );
}

"use client";

import { useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import type { WeddingDto } from "@/modules/wedding/wedding.dto";
import { WeddingDetailsFields, weddingDetailsFromForm } from "./wedding-details-fields";

export function WeddingEditForm({ wedding }: { wedding: WeddingDto }) {
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
    try {
      const response = await fetch(`/api/v1/weddings/${wedding.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify(weddingDetailsFromForm(new FormData(event.currentTarget))),
      });
      let result;
      try {
        result = await response.json();
      } catch {
        setError(
          `The server returned an unexpected response (HTTP ${response.status}). Please try again.`,
        );
        return;
      }
      if (!response.ok || !result.success) {
        setError(result.error?.message ?? "Unable to update your wedding. Please try again.");
        return;
      }
      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("We couldn't reach the server. Check your connection and try again.");
    } finally {
      submitting.current = false;
      setPending(false);
    }
  }

  return (
    <form className="auth-form setup-form" onSubmit={submit} aria-busy={pending}>
      <fieldset className="auth-fields" disabled={pending}>
        <WeddingDetailsFields wedding={wedding} />
        {error && (
          <p className="auth-error" role="alert">
            {error}
          </p>
        )}
        <button className="button auth-submit" type="submit" disabled={pending}>
          {pending ? "Saving changes…" : "Save changes"}
        </button>
      </fieldset>
    </form>
  );
}

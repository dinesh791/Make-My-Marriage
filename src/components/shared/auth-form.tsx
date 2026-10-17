"use client";

import { useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

export function AuthForm({ mode, next }: { mode: "login" | "register"; next?: string | null }) {
  const router = useRouter();
  const submitting = useRef(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const registering = mode === "register";

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting.current) return;
    const form = new FormData(event.currentTarget);
    const password = String(form.get("password") ?? "");
    if (registering && password !== form.get("confirmPassword")) {
      setError("Your passwords don't match. Please enter them again.");
      return;
    }
    submitting.current = true;
    setPending(true);
    setError("");
    try {
      const response = await fetch(`/api/v1/auth/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          email: form.get("email"),
          password,
          ...(registering
            ? { firstName: form.get("firstName") }
            : { remember: form.get("remember") === "on" }),
        }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        setError(result.error?.message ?? "Unable to continue. Please try again.");
        return;
      }
      router.replace(next ?? "/dashboard");
      router.refresh();
    } catch {
      setError("We couldn't reach the server. Check your connection and try again.");
    } finally {
      submitting.current = false;
      setPending(false);
    }
  }

  return (
    <form className="auth-form" onSubmit={submit} aria-busy={pending}>
      <fieldset className="auth-fields" disabled={pending}>
        {registering && (
          <div>
            <label className="field-label" htmlFor="firstName">
              Your name
            </label>
            <input
              className="field"
              id="firstName"
              name="firstName"
              autoComplete="given-name"
              placeholder="Enter your name"
              maxLength={100}
              required
            />
          </div>
        )}
        <div>
          <label className="field-label" htmlFor="email">
            Email address
          </label>
          <input
            className="field"
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            maxLength={254}
            required
          />
        </div>
        <div>
          <label className="field-label" htmlFor="password">
            {registering ? "Create password" : "Password"}
          </label>
          <input
            className="field"
            id="password"
            name="password"
            type="password"
            autoComplete={registering ? "new-password" : "current-password"}
            placeholder={registering ? "At least 12 characters" : "Enter your password"}
            minLength={registering ? 12 : 1}
            maxLength={128}
            aria-describedby={registering ? "password-hint" : undefined}
            required
          />
          {registering && (
            <p className="field-hint" id="password-hint">
              Use 12–128 characters. A few memorable words work well.
            </p>
          )}
        </div>
        {registering ? (
          <div>
            <label className="field-label" htmlFor="confirmPassword">
              Confirm password
            </label>
            <input
              className="field"
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              placeholder="Enter your password again"
              minLength={12}
              maxLength={128}
              required
            />
          </div>
        ) : (
          <div className="auth-options">
            <label className="auth-check">
              <input type="checkbox" name="remember" /> Remember me for 30 days
            </label>
          </div>
        )}
        {error && (
          <p className="auth-error" role="alert">
            {error}
          </p>
        )}
        <button className="button auth-submit" type="submit" disabled={pending}>
          {pending
            ? registering
              ? "Creating account…"
              : "Signing in…"
            : registering
              ? "Create account"
              : "Sign in"}
        </button>
      </fieldset>
      {registering && (
        <p className="field-hint">
          You&apos;ll choose Bride or Groom when you create or join a wedding.
        </p>
      )}
    </form>
  );
}

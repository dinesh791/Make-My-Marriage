import Link from "next/link";
import { AuthShell } from "@/components/shared/auth-shell";

export default function RegisterPage() {
  return (
    <AuthShell>
      <span className="eyebrow">Start your story</span>
      <h2>Create your account</h2>
      <p className="auth-intro">A little planning, a lot of memories.</p>
      <form className="auth-form">
        <div>
          <label className="field-label" htmlFor="name">
            Your name
          </label>
          <input
            className="field"
            id="name"
            name="name"
            autoComplete="name"
            placeholder="Enter your name"
            required
          />
        </div>
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
            required
          />
        </div>
        <div>
          <label className="field-label" htmlFor="role">
            I am the
          </label>
          <select className="field" id="role" name="role" defaultValue="" required>
            <option value="" disabled>
              Select your role
            </option>
            <option value="bride">Bride</option>
            <option value="groom">Groom</option>
          </select>
        </div>
        <div>
          <label className="field-label" htmlFor="password">
            Create password
          </label>
          <input
            className="field"
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            placeholder="At least 8 characters"
            minLength={8}
            required
          />
        </div>
        <button
          className="button auth-submit"
          type="button"
          title="Registration will be connected when authentication is implemented"
        >
          Create account
        </button>
      </form>
      <p className="auth-switch">
        Already have an account?{" "}
        <Link className="text-link" href="/login">
          Sign in
        </Link>
      </p>
      <p className="auth-legal">
        By creating an account, you agree to our Terms of Service and Privacy Policy.
      </p>
    </AuthShell>
  );
}

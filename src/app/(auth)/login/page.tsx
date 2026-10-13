import Link from "next/link";
import { AuthShell } from "@/components/shared/auth-shell";

export default function LoginPage() {
  return (
    <AuthShell>
      <div className="login-return-row">
        <Link className="login-return-link" href="/">
          <span aria-hidden="true">←</span>
          Back to website
        </Link>
      </div>
      <span className="eyebrow">Welcome back</span>
      <h2>Sign in to your account</h2>
      <p className="auth-intro">Your wedding, just where you left it.</p>
      <form className="auth-form">
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
          <label className="field-label" htmlFor="password">
            Password
          </label>
          <input
            className="field"
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            placeholder="Enter your password"
            required
          />
        </div>
        <div className="auth-options">
          <label className="auth-check">
            <input type="checkbox" name="remember" /> Remember me
          </label>
          <Link className="text-link" href="/forgot-password">
            Forgot password?
          </Link>
        </div>
        <button
          className="button auth-submit"
          type="button"
          title="Sign-in will be connected when authentication is implemented"
        >
          Sign in
        </button>
      </form>
      <div className="auth-divider">or continue with</div>
      <button
        className="button google-button"
        type="button"
        title="Google sign-in will be connected when authentication is implemented"
      >
        <span className="google-g">G</span> Continue with Google
      </button>
      <p className="auth-switch">
        New to Make My Marriage?{" "}
        <Link className="text-link" href="/register">
          Create an account
        </Link>
      </p>
      <p className="auth-legal">
        By continuing, you agree to our Terms of Service and Privacy Policy.
      </p>
    </AuthShell>
  );
}

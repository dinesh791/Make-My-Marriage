import Link from "next/link";
import { AuthShell } from "@/components/shared/auth-shell";
import { AuthForm } from "@/components/shared/auth-form";
import { currentUser } from "@/lib/auth/current-user";
import { redirect } from "next/navigation";
import { safeInviteReturn } from "@/lib/auth/invite-return";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string | string[] }>;
}) {
  const next = safeInviteReturn((await searchParams).next);
  if (await currentUser()) redirect(next ?? "/dashboard");
  return (
    <AuthShell>
      <span className="eyebrow">Welcome back</span>
      <h2>Sign in to your account</h2>
      <p className="auth-intro">Your wedding, just where you left it.</p>
      <AuthForm mode="login" next={next} />
      <div className="auth-divider">or continue with</div>
      <button className="button google-button" type="button" disabled>
        <span className="google-g">G</span> Google sign-in · coming soon
      </button>
      <p className="field-hint">Password recovery is coming soon.</p>
      <p className="auth-switch">
        New to Make My Marriage?{" "}
        <Link
          className="text-link"
          href={next ? `/register?next=${encodeURIComponent(next)}` : "/register"}
        >
          Create an account
        </Link>
      </p>
      <p className="auth-legal">
        By continuing, you agree to our Terms of Service and Privacy Policy.
      </p>
    </AuthShell>
  );
}

import Link from "next/link";
import { AuthShell } from "@/components/shared/auth-shell";
import { AuthForm } from "@/components/shared/auth-form";
import { currentUser } from "@/lib/auth/current-user";
import { redirect } from "next/navigation";
import { safeInviteReturn } from "@/lib/auth/invite-return";

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string | string[] }>;
}) {
  const next = safeInviteReturn((await searchParams).next);
  if (await currentUser()) redirect(next ?? "/dashboard");
  return (
    <AuthShell>
      <span className="eyebrow">Start your story</span>
      <h2>Create your account</h2>
      <p className="auth-intro">A little planning, a lot of memories.</p>
      <AuthForm mode="register" next={next} />
      <p className="auth-switch">
        Already have an account?{" "}
        <Link
          className="text-link"
          href={next ? `/login?next=${encodeURIComponent(next)}` : "/login"}
        >
          Sign in
        </Link>
      </p>
      <p className="auth-legal">
        By creating an account, you agree to our Terms of Service and Privacy Policy.
      </p>
    </AuthShell>
  );
}

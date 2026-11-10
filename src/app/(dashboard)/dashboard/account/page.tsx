import { AccountProfileForm } from "@/components/shared/account-profile-form";
import { requireUser } from "@/lib/auth/current-user";

export default async function AccountPage() {
  const user = await requireUser();
  return (
    <section className="account-workspace">
      <header className="account-heading">
        <span className="eyebrow">Your account</span>
        <h1>Account settings</h1>
        <p>Update your account name and sign-in email. Wedding names are managed separately.</p>
      </header>
      <AccountProfileForm
        key={`${user.id}-${user.firstName}-${user.lastName ?? ""}-${user.email}`}
        firstName={user.firstName}
        lastName={user.lastName ?? ""}
        email={user.email}
      />
    </section>
  );
}

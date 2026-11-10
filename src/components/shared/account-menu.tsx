import Link from "next/link";
import { SidebarIcon } from "./sidebar-icon";
import { SignOutButton } from "./sign-out-button";

export function AccountMenu({
  firstName,
  lastName,
  email,
}: {
  firstName: string;
  lastName: string;
  email: string;
}) {
  const displayName = [firstName, lastName].filter(Boolean).join(" ");
  return (
    <details className="account-menu">
      <summary className="account-menu-trigger" aria-label="Open account menu">
        <SidebarIcon name="account" />
        <span className="account-menu-name">{displayName}</span>
      </summary>
      <div className="account-menu-popover">
        <div className="account-menu-identity">
          <strong>{displayName}</strong>
          <span>{email}</span>
        </div>
        <Link href="/dashboard/account" className="account-menu-action">
          <SidebarIcon name="account" />
          Account settings
        </Link>
        <SignOutButton variant="menu" />
      </div>
    </details>
  );
}

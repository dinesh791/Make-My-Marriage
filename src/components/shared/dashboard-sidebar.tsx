"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Brand } from "./brand";
import { SignOutButton } from "./sign-out-button";

const pages = [
  { label: "Overview", icon: "O", href: "/dashboard" },
  { label: "Couple details", icon: "C", href: "/dashboard/wedding/edit" },
  { label: "Wedding events", icon: "E", href: "/dashboard/events" },
  { label: "Invitation", icon: "I", href: "/dashboard/invitation" },
  { label: "Shopping checklist", icon: "S", href: "/dashboard/shopping" },
  { label: "Photo gallery", icon: "G", href: "/dashboard/gallery" },
];

const plannedPages = [
  { label: "Catering", icon: "F" },
  { label: "Livestream", icon: "L" },
];

export function DashboardSidebar({ weddingSlug }: { weddingSlug: string | null }) {
  const pathname = usePathname();
  return (
    <aside className="dashboard-sidebar">
      <Brand href="/dashboard" />
      <p className="sidebar-label">Your workspace</p>
      <nav className="sidebar-nav" aria-label="Wedding workspace">
        {pages.map(({ label, icon, href }) => {
          if (!weddingSlug && href !== "/dashboard") {
            return (
              <span className="nav-disabled" data-icon={icon} key={href}>
                {label}
              </span>
            );
          }
          const active = pathname === href;
          return (
            <Link
              key={href}
              className={active ? "active" : ""}
              aria-current={active ? "page" : undefined}
              data-icon={icon}
              href={href}
            >
              {label}
            </Link>
          );
        })}
        {weddingSlug ? (
          <Link data-icon="W" href={`/w/${weddingSlug}`} target="_blank" rel="noopener noreferrer">
            Wedding website
          </Link>
        ) : (
          <span className="nav-disabled" data-icon="W">
            Wedding website
          </span>
        )}
        {plannedPages.map(({ label, icon }) => (
          <span className="nav-disabled" data-icon={icon} key={label}>
            {label}
            <span className="coming-soon">Soon</span>
          </span>
        ))}
      </nav>
      <div className="sidebar-bottom">
        <p className="sidebar-label">Account</p>
        <nav className="sidebar-nav" aria-label="Account">
          <SignOutButton />
        </nav>
      </div>
    </aside>
  );
}

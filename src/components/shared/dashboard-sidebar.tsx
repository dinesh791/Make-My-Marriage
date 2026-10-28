"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Brand } from "./brand";
import { SignOutButton } from "./sign-out-button";
import { SidebarIcon } from "./sidebar-icon";

const pages = [
  { label: "Overview", icon: "overview", href: "/dashboard" },
  { label: "Couple details", icon: "couple", href: "/dashboard/wedding/edit" },
  { label: "Wedding events", icon: "events", href: "/dashboard/events" },
  { label: "Invitation", icon: "invitation", href: "/dashboard/invitation" },
  { label: "Shopping checklist", icon: "shopping", href: "/dashboard/shopping" },
  { label: "Photo gallery", icon: "gallery", href: "/dashboard/gallery" },
] as const;

const plannedPages = [
  { label: "Catering", icon: "catering" },
  { label: "Livestream", icon: "livestream" },
] as const;

export function DashboardSidebar({ weddingSlug }: { weddingSlug: string | null }) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <aside className="dashboard-sidebar">
      <div className="sidebar-header">
        <Brand href="/dashboard" />
        <button
          className="sidebar-menu-toggle"
          type="button"
          aria-controls="dashboard-navigation"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((open) => !open)}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            aria-hidden="true"
          >
            <path d={menuOpen ? "M5 5l14 14M19 5 5 19" : "M4 7h16M4 12h16M4 17h16"} />
          </svg>
          {menuOpen ? "Close" : "Menu"}
        </button>
      </div>
      <p className="sidebar-label">Your workspace</p>
      <nav
        id="dashboard-navigation"
        className={menuOpen ? "sidebar-nav open" : "sidebar-nav"}
        aria-label="Wedding workspace"
      >
        {pages.map(({ label, icon, href }) => {
          if (!weddingSlug && href !== "/dashboard") {
            return (
              <span className="nav-disabled" key={href}>
                <SidebarIcon name={icon} />
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
              href={href}
              onClick={() => setMenuOpen(false)}
            >
              <SidebarIcon name={icon} />
              {label}
            </Link>
          );
        })}
        {weddingSlug ? (
          <Link
            href={`/w/${weddingSlug}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setMenuOpen(false)}
          >
            <SidebarIcon name="website" />
            Wedding website
          </Link>
        ) : (
          <span className="nav-disabled">
            <SidebarIcon name="website" />
            Wedding website
          </span>
        )}
        {plannedPages.map(({ label, icon }) => (
          <span className="nav-disabled" key={label}>
            <SidebarIcon name={icon} />
            {label}
            <span className="coming-soon">Soon</span>
          </span>
        ))}
        <SignOutButton />
      </nav>
    </aside>
  );
}

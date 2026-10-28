type SidebarIconName =
  | "overview"
  | "couple"
  | "events"
  | "invitation"
  | "shopping"
  | "gallery"
  | "website"
  | "catering"
  | "livestream"
  | "signout";

const paths: Record<SidebarIconName, React.ReactNode> = {
  overview: (
    <>
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </>
  ),
  couple: (
    <>
      <circle cx="8" cy="8" r="3" />
      <circle cx="17" cy="9" r="2.5" />
      <path d="M2.5 20v-2a5.5 5.5 0 0 1 11 0v2M15 15a4.5 4.5 0 0 1 6.5 4v1" />
    </>
  ),
  events: (
    <>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M7 3v4M17 3v4M3 10h18M8 15h3" />
    </>
  ),
  invitation: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3 7 9 6 9-6" />
    </>
  ),
  shopping: (
    <>
      <path d="M4 8h16l-1.5 13h-13L4 8ZM9 9V6a3 3 0 0 1 6 0v3" />
    </>
  ),
  gallery: (
    <>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <path d="m4 17 5-5 3 3 3-3 5 5" />
    </>
  ),
  website: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18" />
    </>
  ),
  catering: (
    <>
      <path d="M4 3v8a3 3 0 0 0 6 0V3M7 3v18M17 3c-2 2-3 5-3 9h4V3M18 12v9" />
    </>
  ),
  livestream: (
    <>
      <rect x="3" y="6" width="13" height="12" rx="2" />
      <path d="m16 10 5-3v10l-5-3M7 10l4 2-4 2z" />
    </>
  ),
  signout: (
    <>
      <path d="M10 4H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h5M14 8l4 4-4 4M8 12h10" />
    </>
  ),
};

export function SidebarIcon({ name }: { name: SidebarIconName }) {
  return (
    <span className="sidebar-icon" aria-hidden="true">
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {paths[name]}
      </svg>
    </span>
  );
}

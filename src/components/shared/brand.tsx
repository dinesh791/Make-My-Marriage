import Link from "next/link";

export function Brand({ className = "", href = "/login" }: { className?: string; href?: string }) {
  return (
    <Link className={`brand ${className}`.trim()} href={href} aria-label="Make My Marriage">
      <span className="brand-mark" aria-hidden="true">
        <svg viewBox="0 0 44 44" fill="none">
          <circle cx="17" cy="23" r="9" stroke="#d4af37" strokeWidth="2.2" />
          <circle cx="27" cy="23" r="9" stroke="#d4af37" strokeWidth="2.2" />
          <path d="M22 13V8M19 8h6" stroke="#d4af37" strokeWidth="1.8" strokeLinecap="round" />
          <circle cx="22" cy="6" r="1.5" fill="#d4af37" />
          <path d="M15 30c3 3 11 3 14 0" stroke="#d4af37" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </span>
      <span>Make My Marriage</span>
    </Link>
  );
}

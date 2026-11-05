export default function DashboardLoading() {
  return (
    <div className="dashboard-loading" role="status" aria-live="polite">
      <svg className="wedding-loader" viewBox="0 0 96 64" fill="none" aria-hidden="true">
        <circle cx="36" cy="34" r="20" stroke="currentColor" strokeWidth="5" />
        <circle cx="60" cy="34" r="20" stroke="currentColor" strokeWidth="5" />
        <path d="m48 5 4 6-4 6-4-6 4-6Z" fill="currentColor" />
      </svg>
      <span>Loading your wedding workspace…</span>
    </div>
  );
}

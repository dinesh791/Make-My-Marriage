export default function DashboardLoading() {
  return (
    <div className="dashboard-loading" role="status" aria-live="polite">
      <span className="eyebrow">Your wedding workspace</span>
      <div className="dashboard-loading-bar" />
      <div className="dashboard-loading-card" />
      <p>Loading your wedding workspace…</p>
    </div>
  );
}

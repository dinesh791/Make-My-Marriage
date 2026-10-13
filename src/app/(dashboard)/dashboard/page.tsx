import Image from "next/image";
import Link from "next/link";
import { Brand } from "@/components/shared/brand";

const workspaceLinks = [
  ["Overview", "O", "#overview"],
  ["Couple details", "C", "#couple"],
  ["Wedding events", "E", "#events"],
  ["Invitation", "I", "#invitation"],
  ["Wedding website", "W", "/w/dinesh-usha"],
  ["Shopping checklist", "S", "#shopping"],
  ["Catering", "F", "#catering"],
  ["Photo gallery", "G", "#gallery"],
  ["Livestream", "L", "#livestream"],
];

export default function DashboardPage() {
  return (
    <main className="dashboard-app" id="overview">
      <div className="dashboard-layout">
        <aside className="dashboard-sidebar">
          <Brand href="/dashboard" />
          <p className="sidebar-label">Your workspace</p>
          <nav className="sidebar-nav" aria-label="Wedding workspace">
            {workspaceLinks.map(([label, icon, href], index) =>
              index === 0 || index === 4 ? (
                <Link
                  className={index === 0 ? "active" : ""}
                  data-icon={icon}
                  href={href}
                  key={label}
                >
                  {label}
                </Link>
              ) : (
                <span className="nav-disabled" data-icon={icon} key={label}>
                  {label}
                  <span className="coming-soon">Soon</span>
                </span>
              ),
            )}
          </nav>
          <div className="sidebar-bottom">
            <p className="sidebar-label">Account</p>
            <nav className="sidebar-nav" aria-label="Account">
              <span className="action-disabled">
                Sign out <small>Authentication coming soon</small>
              </span>
            </nav>
          </div>
        </aside>

        <section className="dashboard-main">
          <header className="dashboard-topbar">
            <div>
              <span className="eyebrow">Wedding workspace preview</span>
              <p>Tuesday, 13 October 2026</p>
            </div>
            <div className="avatar" aria-label="Dinesh and Usha">
              DU
            </div>
          </header>
          <div className="dashboard-welcome">
            <div>
              <span className="eyebrow">Vanakkam, Dinesh &amp; Usha</span>
              <h1>Your wedding, at a glance</h1>
              <p>Keep the little details moving and enjoy the big moments.</p>
            </div>
            <Link className="button button-outline" href="/w/dinesh-usha">
              Preview website ↗
            </Link>
          </div>

          <section className="dashboard-hero" id="couple" aria-label="Wedding overview">
            <div className="dashboard-hero-copy">
              <span className="eyebrow">The celebration is getting closer</span>
              <h2 className="serif">Dinesh &amp; Usha</h2>
              <p>Wednesday, 20 January 2027 · Sivan Mahal, Salem</p>
              <Link className="button" href="/w/dinesh-usha">
                View wedding website <span aria-hidden="true">→</span>
              </Link>
            </div>
            <Image
              className="dashboard-hero-image"
              src="/images/wedding/stitch-couple.webp"
              alt="Wedding portrait of a couple"
              width={760}
              height={500}
              priority
            />
          </section>

          <section className="dashboard-stats" aria-label="Wedding summary">
            <article className="stat-card">
              <span>Days until the wedding</span>
              <strong>99</strong>
            </article>
            <article className="stat-card">
              <span>Events in your schedule</span>
              <strong>4</strong>
            </article>
            <article className="stat-card">
              <span>Planning checklist</span>
              <strong>18 / 42</strong>
            </article>
          </section>

          <div className="dashboard-columns">
            <section className="dashboard-card" id="events">
              <div className="card-heading">
                <h2>Upcoming events</h2>
                <span className="coming-soon">Sample data</span>
              </div>
              <div className="event-row">
                <div className="event-date">
                  <strong>08</strong>
                  <span>Jan</span>
                </div>
                <div>
                  <h3>Engagement</h3>
                  <p>6:00 PM · Sivan Mahal</p>
                </div>
                <span className="status-pill">Planned</span>
              </div>
              <div className="event-row">
                <div className="event-date">
                  <strong>18</strong>
                  <span>Jan</span>
                </div>
                <div>
                  <h3>Nalangu</h3>
                  <p>4:30 PM · Sivan Mahal</p>
                </div>
                <span className="status-pill">Planned</span>
              </div>
              <div className="event-row">
                <div className="event-date">
                  <strong>20</strong>
                  <span>Jan</span>
                </div>
                <div>
                  <h3>Muhurtham</h3>
                  <p>6:00 AM · Sivan Mahal</p>
                </div>
                <span className="status-pill">Planned</span>
              </div>
              <div className="event-row">
                <div className="event-date">
                  <strong>20</strong>
                  <span>Jan</span>
                </div>
                <div>
                  <h3>Reception</h3>
                  <p>6:00 PM · Sivan Mahal</p>
                </div>
                <span className="status-pill">Planned</span>
              </div>
            </section>

            <section className="dashboard-card" id="invitation">
              <div className="card-heading">
                <h2>Quick actions</h2>
              </div>
              <div className="action-list">
                <Link href="/w/dinesh-usha">
                  Preview wedding website <span>↗</span>
                </Link>
                <span className="action-disabled">
                  Edit wedding details <small>Coming soon</small>
                </span>
                <span className="action-disabled">
                  Preview invitation <small>Coming soon</small>
                </span>
                <span className="action-disabled">
                  Share wedding link <small>Coming soon</small>
                </span>
              </div>
              <div className="progress" aria-label="Planning checklist 42 percent complete">
                <span />
              </div>
              <p className="progress-note">Planning checklist · sample progress</p>
            </section>
          </div>
        </section>
      </div>
    </main>
  );
}

import Link from "next/link";
import { redirect } from "next/navigation";
import { WeddingEventsForm } from "@/components/shared/wedding-events-form";
import { requireUser } from "@/lib/auth/current-user";
import { listMemberEvents } from "@/modules/event/event.service";
import { getMyWedding } from "@/modules/wedding/wedding.service";

export default async function WeddingEventsPage() {
  const user = await requireUser();
  const wedding = await getMyWedding(user.id);
  if (!wedding) redirect("/dashboard");
  const events = await listMemberEvents(String(wedding._id), user.id);

  return (
    <main className="dashboard-app setup-dashboard">
      <div className="setup-dashboard-inner event-workspace">
        <Link className="text-link" href="/dashboard">
          ← Back to dashboard
        </Link>
        <div className="event-workspace-heading">
          <span className="eyebrow">Your wedding workspace</span>
          <h1>Wedding events</h1>
          <p>
            Plan Engagement, Nalangu, Muhurtham, and Reception. Save unfinished plans as drafts;
            enabled events with a date and time appear for attending guests.
          </p>
          <p>Your main wedding date and countdown are edited separately in Wedding details.</p>
        </div>
        <WeddingEventsForm weddingId={String(wedding._id)} events={events} />
      </div>
    </main>
  );
}

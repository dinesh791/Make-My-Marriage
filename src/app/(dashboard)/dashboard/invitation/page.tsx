import Link from "next/link";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/current-user";
import { getMyWedding } from "@/modules/wedding/wedding.service";
import { getInvitationPreview } from "@/modules/invitation/invitation.service";
import { InvitationEditor } from "@/components/shared/invitation-editor";

export default async function InvitationPage() {
  const user = await requireUser();
  const wedding = await getMyWedding(user.id);
  if (!wedding) redirect("/dashboard");
  const preview = await getInvitationPreview(String(wedding._id), user.id);
  return (
    <main className="dashboard-app setup-dashboard">
      <div className="setup-dashboard-inner invitation-workspace">
        <Link className="text-link" href="/dashboard">
          ← Back to dashboard
        </Link>
        <div className="event-workspace-heading">
          <span className="eyebrow">Your wedding workspace</span>
          <h1>Wedding invitation</h1>
          <p>
            A Traditional Tamil invitation, with your own words. Save a draft, preview it, then
            publish when ready.
          </p>
        </div>
        <InvitationEditor weddingId={String(wedding._id)} {...preview} />
      </div>
    </main>
  );
}

import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/current-user";
import { getMyWedding } from "@/modules/wedding/wedding.service";
import { getLivestream } from "@/modules/livestream/livestream.service";
import { LivestreamManager } from "@/components/shared/livestream-manager";
export default async function LivestreamPage() {
  const user = await requireUser();
  const wedding = await getMyWedding(user.id);
  if (!wedding) redirect("/dashboard");
  const weddingId = String(wedding._id);
  return (
    <LivestreamManager weddingId={weddingId} initial={await getLivestream(weddingId, user.id)} />
  );
}

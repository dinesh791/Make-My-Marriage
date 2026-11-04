import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/current-user";
import { getMyWedding } from "@/modules/wedding/wedding.service";
import { getCatering } from "@/modules/catering/catering.service";
import { CateringManager } from "@/components/shared/catering-manager";
export default async function CateringPage() {
  const user = await requireUser();
  const wedding = await getMyWedding(user.id);
  if (!wedding) redirect("/dashboard");
  const weddingId = String(wedding._id);
  return <CateringManager weddingId={weddingId} initial={await getCatering(weddingId, user.id)} />;
}

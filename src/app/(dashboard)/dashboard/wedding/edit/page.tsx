import { redirect } from "next/navigation";
import { WeddingEditForm } from "@/components/shared/wedding-edit-form";
import { requireUser } from "@/lib/auth/current-user";
import { toWeddingDto } from "@/modules/wedding/wedding.dto";
import { getMyWedding } from "@/modules/wedding/wedding.service";

export default async function EditWeddingPage() {
  const user = await requireUser();
  const savedWedding = await getMyWedding(user.id);
  if (!savedWedding) redirect("/dashboard");
  const wedding = toWeddingDto(savedWedding);

  return (
    <div className="setup-dashboard-inner">
      <section className="setup-card">
        <span className="eyebrow">Your wedding workspace</span>
        <h1>Edit wedding details</h1>
        <p>Update the details for {wedding.title}. Your wedding link stays the same.</p>
        <WeddingEditForm wedding={wedding} />
      </section>
    </div>
  );
}

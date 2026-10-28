import { redirect } from "next/navigation";
import { GalleryManager } from "@/components/shared/gallery-manager";
import { requireUser } from "@/lib/auth/current-user";
import { memberGallery } from "@/modules/gallery/gallery.service";
import { getMyWedding } from "@/modules/wedding/wedding.service";

export default async function GalleryPage() {
  const user = await requireUser();
  const wedding = await getMyWedding(user.id);
  if (!wedding) redirect("/dashboard");
  const gallery = await memberGallery(String(wedding._id), user.id);
  return <GalleryManager weddingId={String(wedding._id)} initialGallery={gallery} />;
}

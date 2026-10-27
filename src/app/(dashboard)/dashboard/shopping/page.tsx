import { redirect } from "next/navigation";
import { ShoppingChecklist } from "@/components/shared/shopping-checklist";
import { requireUser } from "@/lib/auth/current-user";
import { getMyWedding } from "@/modules/wedding/wedding.service";
import { listMemberShoppingItems } from "@/modules/shopping/shopping.service";

export default async function ShoppingPage() {
  const user = await requireUser();
  const wedding = await getMyWedding(user.id);
  if (!wedding) redirect("/dashboard");
  const items = await listMemberShoppingItems(String(wedding._id), user.id);
  return <ShoppingChecklist weddingId={String(wedding._id)} initialItems={items} />;
}

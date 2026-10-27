import type { ReactNode } from "react";
import { DashboardSidebar } from "@/components/shared/dashboard-sidebar";
import { requireUser } from "@/lib/auth/current-user";
import { getMyWedding } from "@/modules/wedding/wedding.service";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const user = await requireUser();
  const wedding = await getMyWedding(user.id);
  return (
    <main className="dashboard-app">
      <div className="dashboard-layout">
        <DashboardSidebar weddingSlug={wedding?.slug ?? null} />
        <div className="dashboard-main">{children}</div>
      </div>
    </main>
  );
}

/**
 * Dashboard overview page.
 * Shows welcome greeting, real stats, and quick actions.
 */

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { DashboardOverview } from "@/components/dashboard/dashboard-overview";

export const metadata = {
  title: "Dashboard - DoNext",
  description: "Your personal task management dashboard",
};

export default async function DashboardPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  const userName = session?.user?.name?.split(" ")[0] || "there";

  return <DashboardOverview userName={userName} />;
}

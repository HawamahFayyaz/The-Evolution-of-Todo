/**
 * Dashboard overview page.
 * Shows welcome greeting, stats, and quick actions.
 */

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  ClipboardList,
  CheckCircle,
  Clock,
  ArrowRight,
  Plus,
  Sparkles,
} from "lucide-react";

export const metadata = {
  title: "Dashboard - DoNext",
  description: "Your personal task management dashboard",
};

export default async function DashboardPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  const userName = session?.user?.name?.split(" ")[0] || "there";

  const hour = new Date().getHours();
  let greeting = "Good morning";
  if (hour >= 12 && hour < 17) greeting = "Good afternoon";
  else if (hour >= 17) greeting = "Good evening";

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Welcome Section */}
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">
          {greeting}, {userName}!
        </h1>
        <p className="mt-1 text-[var(--text-secondary)]">
          Here&apos;s an overview of your tasks and productivity.
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          icon={ClipboardList}
          iconBg="bg-indigo-50"
          iconColor="text-indigo-600"
          value={0}
          label="Total Tasks"
        />
        <StatCard
          icon={CheckCircle}
          iconBg="bg-emerald-50"
          iconColor="text-emerald-600"
          value={0}
          label="Completed"
        />
        <StatCard
          icon={Clock}
          iconBg="bg-amber-50"
          iconColor="text-amber-600"
          value={0}
          label="Pending"
        />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Today's Focus */}
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-[var(--text-primary)]">
              Today&apos;s Focus
            </h2>
            <Link
              href="/dashboard/tasks"
              className="text-sm font-medium text-indigo-600 hover:text-indigo-500 transition-colors inline-flex items-center gap-1"
            >
              View all <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="text-center py-8">
            <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-[var(--surface-secondary)] flex items-center justify-center">
              <ClipboardList className="w-6 h-6 text-[var(--text-muted)]" />
            </div>
            <p className="text-sm text-[var(--text-secondary)] mb-4">No tasks for today yet</p>
            <Link href="/dashboard/tasks">
              <Button variant="gradient" size="sm">
                <Plus className="w-4 h-4" />
                Create your first task
              </Button>
            </Link>
          </div>
        </div>

        {/* AI Assistant Card */}
        <div className="bg-gradient-to-br from-indigo-600 to-violet-600 rounded-xl p-6 text-white relative overflow-hidden">
          {/* Background decoration */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />

          <div className="relative">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                <Sparkles className="w-4 h-4" />
              </div>
              <h2 className="text-base font-semibold">AI Task Assistant</h2>
            </div>
            <p className="text-indigo-100 text-sm mb-4 max-w-[280px]">
              Use natural language to create, manage, and organize your tasks.
              Click the chat button to get started.
            </p>
            <div className="flex flex-wrap gap-2">
              <span className="px-2.5 py-1 bg-white/15 rounded-lg text-xs">
                &quot;Add buy groceries&quot;
              </span>
              <span className="px-2.5 py-1 bg-white/15 rounded-lg text-xs">
                &quot;Show my tasks&quot;
              </span>
              <span className="px-2.5 py-1 bg-white/15 rounded-lg text-xs">
                &quot;Mark it done&quot;
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Getting Started */}
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-6">
        <h2 className="text-base font-semibold text-[var(--text-primary)] mb-4">Quick Actions</h2>
        <div className="flex flex-wrap gap-3">
          <Link href="/dashboard/tasks">
            <Button variant="gradient" size="sm">
              <Plus className="w-4 h-4" />
              New Task
            </Button>
          </Link>
          <Link href="/dashboard/tasks">
            <Button variant="secondary" size="sm">
              View All Tasks
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  iconBg,
  iconColor,
  value,
  label,
}: {
  icon: React.ComponentType<{ className?: string }>;
  iconBg: string;
  iconColor: string;
  value: number;
  label: string;
}) {
  return (
    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-5 hover:shadow-sm hover:border-[var(--border-hover)] transition-all">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-xl ${iconBg} flex items-center justify-center`}>
          <Icon className={`w-5 h-5 ${iconColor}`} />
        </div>
        <div>
          <p className="text-2xl font-bold text-[var(--text-primary)]">{value}</p>
          <p className="text-sm text-[var(--text-secondary)]">{label}</p>
        </div>
      </div>
    </div>
  );
}

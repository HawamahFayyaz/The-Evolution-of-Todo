"use client";

import { useEffect, useMemo } from "react";
import Link from "next/link";
import { useTasks } from "@/hooks/use-tasks";
import { Button } from "@/components/ui/button";
import {
  ClipboardList,
  CheckCircle,
  Clock,
  ArrowRight,
  Plus,
  Sparkles,
  Calendar,
  Flag,
} from "lucide-react";
import type { Task } from "@/types";
import { cn } from "@/lib/utils";

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function isToday(dateStr: string | null): boolean {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  const now = new Date();
  return d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();
}

function isDueSoon(dateStr: string | null): boolean {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  const now = new Date();
  const diff = d.getTime() - now.getTime();
  return diff > 0 && diff < 3 * 24 * 60 * 60 * 1000; // within 3 days
}

const PRIORITY_COLORS: Record<string, string> = {
  high: "text-red-500",
  medium: "text-amber-500",
  low: "text-slate-400",
};

export function DashboardOverview({ userName }: { userName: string }) {
  const { tasks, loading } = useTasks();

  const stats = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter(t => t.completed).length;
    const pending = total - completed;
    return { total, completed, pending };
  }, [tasks]);

  const todayTasks = useMemo(() => {
    return tasks
      .filter(t => !t.completed && (isToday(t.dueDate) || isDueSoon(t.dueDate)))
      .sort((a, b) => {
        // High priority first, then by due date
        const pRank = { high: 0, medium: 1, low: 2 };
        const pDiff = pRank[a.priority] - pRank[b.priority];
        if (pDiff !== 0) return pDiff;
        if (a.dueDate && b.dueDate) return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        return a.dueDate ? -1 : 1;
      })
      .slice(0, 5);
  }, [tasks]);

  const greeting = getGreeting();

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
          iconBg="bg-indigo-50 dark:bg-indigo-900/20"
          iconColor="text-indigo-600 dark:text-indigo-400"
          value={loading ? "-" : stats.total}
          label="Total Tasks"
        />
        <StatCard
          icon={CheckCircle}
          iconBg="bg-emerald-50 dark:bg-emerald-900/20"
          iconColor="text-emerald-600 dark:text-emerald-400"
          value={loading ? "-" : stats.completed}
          label="Completed"
        />
        <StatCard
          icon={Clock}
          iconBg="bg-amber-50 dark:bg-amber-900/20"
          iconColor="text-amber-600 dark:text-amber-400"
          value={loading ? "-" : stats.pending}
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

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-[var(--surface-secondary)]">
                  <div className="w-4 h-4 rounded skeleton" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3.5 w-2/3 skeleton" />
                    <div className="h-3 w-1/3 skeleton" />
                  </div>
                </div>
              ))}
            </div>
          ) : todayTasks.length > 0 ? (
            <div className="space-y-2">
              {todayTasks.map(task => (
                <Link
                  key={task.id}
                  href="/dashboard/tasks"
                  className="flex items-center gap-3 p-3 rounded-lg bg-[var(--surface-secondary)] hover:bg-[var(--surface-secondary)]/80 transition-colors group"
                >
                  <Flag className={cn("w-3.5 h-3.5 flex-shrink-0", PRIORITY_COLORS[task.priority])} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[var(--text-primary)] truncate">{task.title}</p>
                    {task.dueDate && (
                      <p className="text-[11px] text-[var(--text-muted)] flex items-center gap-1 mt-0.5">
                        <Calendar className="w-3 h-3" />
                        {isToday(task.dueDate) ? "Due today" : new Date(task.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-[var(--surface-secondary)] flex items-center justify-center">
                <ClipboardList className="w-6 h-6 text-[var(--text-muted)]" />
              </div>
              <p className="text-sm text-[var(--text-secondary)] mb-4">
                {stats.total === 0 ? "No tasks yet" : "No upcoming tasks due soon"}
              </p>
              <Link href="/dashboard/tasks">
                <Button variant="gradient" size="sm">
                  <Plus className="w-4 h-4" />
                  {stats.total === 0 ? "Create your first task" : "View all tasks"}
                </Button>
              </Link>
            </div>
          )}
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
  value: number | string;
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

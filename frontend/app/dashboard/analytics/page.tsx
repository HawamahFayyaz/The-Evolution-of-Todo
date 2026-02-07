"use client";

import { useTasks } from "@/hooks/use-tasks";
import { cn } from "@/lib/utils";
import {
  CheckCircle,
  Clock,
  TrendingUp,
  Target,
  Flame,
  Flag,
} from "lucide-react";

export default function AnalyticsPage() {
  const { tasks, loading } = useTasks();

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.completed).length;
  const pendingTasks = totalTasks - completedTasks;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const highPriority = tasks.filter((t) => t.priority === "high" && !t.completed).length;
  const mediumPriority = tasks.filter((t) => t.priority === "medium" && !t.completed).length;
  const lowPriority = tasks.filter((t) => t.priority === "low" && !t.completed).length;

  const overdueTasks = tasks.filter((t) => {
    if (!t.dueDate || t.completed) return false;
    return new Date(t.dueDate) < new Date();
  }).length;

  const todayTasks = tasks.filter((t) => {
    if (!t.dueDate) return false;
    const due = new Date(t.dueDate).toDateString();
    return due === new Date().toDateString();
  }).length;

  // Completion by day (last 7 days)
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d;
  });

  const completionsByDay = last7Days.map((day) => {
    const count = tasks.filter((t) => {
      if (!t.completed || !t.updatedAt) return false;
      return new Date(t.updatedAt).toDateString() === day.toDateString();
    }).length;
    return {
      label: day.toLocaleDateString("en-US", { weekday: "short" }),
      count,
    };
  });

  const maxCompletions = Math.max(...completionsByDay.map((d) => d.count), 1);

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="h-8 w-48 skeleton rounded-lg" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 skeleton rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Analytics</h1>
        <p className="mt-1 text-[var(--text-secondary)]">
          Track your productivity and task completion trends.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard
          icon={Target}
          iconBg="bg-indigo-50 dark:bg-indigo-900/20"
          iconColor="text-indigo-600 dark:text-indigo-400"
          value={completionRate}
          suffix="%"
          label="Completion Rate"
        />
        <MetricCard
          icon={CheckCircle}
          iconBg="bg-emerald-50 dark:bg-emerald-900/20"
          iconColor="text-emerald-600 dark:text-emerald-400"
          value={completedTasks}
          label="Completed"
        />
        <MetricCard
          icon={Clock}
          iconBg="bg-amber-50 dark:bg-amber-900/20"
          iconColor="text-amber-600 dark:text-amber-400"
          value={pendingTasks}
          label="Pending"
        />
        <MetricCard
          icon={Flame}
          iconBg="bg-red-50 dark:bg-red-900/20"
          iconColor="text-red-600 dark:text-red-400"
          value={overdueTasks}
          label="Overdue"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Completion Trend */}
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-6">
          <div className="flex items-center gap-2 mb-6">
            <TrendingUp className="w-5 h-5 text-indigo-500" />
            <h2 className="text-base font-semibold text-[var(--text-primary)]">
              Completions (Last 7 Days)
            </h2>
          </div>
          <div className="flex items-end gap-3 h-40">
            {completionsByDay.map((day, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2">
                <div className="w-full flex items-end justify-center h-28">
                  <div
                    className={cn(
                      "w-full max-w-[40px] rounded-t-lg transition-all",
                      day.count > 0
                        ? "bg-gradient-to-t from-indigo-600 to-violet-500"
                        : "bg-slate-200 dark:bg-slate-700"
                    )}
                    style={{
                      height: `${Math.max((day.count / maxCompletions) * 100, 8)}%`,
                    }}
                  />
                </div>
                <span className="text-[11px] text-[var(--text-muted)] font-medium">
                  {day.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Priority Breakdown */}
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-6">
          <div className="flex items-center gap-2 mb-6">
            <Flag className="w-5 h-5 text-indigo-500" />
            <h2 className="text-base font-semibold text-[var(--text-primary)]">
              Priority Breakdown
            </h2>
          </div>
          <div className="space-y-4">
            <PriorityBar label="High" count={highPriority} total={pendingTasks} color="bg-red-500" />
            <PriorityBar label="Medium" count={mediumPriority} total={pendingTasks} color="bg-amber-500" />
            <PriorityBar label="Low" count={lowPriority} total={pendingTasks} color="bg-slate-400" />
          </div>

          {/* Summary */}
          <div className="mt-6 pt-4 border-t border-[var(--border)] grid grid-cols-2 gap-4">
            <div>
              <p className="text-2xl font-bold text-[var(--text-primary)]">{todayTasks}</p>
              <p className="text-xs text-[var(--text-muted)]">Due Today</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-[var(--text-primary)]">{totalTasks}</p>
              <p className="text-xs text-[var(--text-muted)]">Total Tasks</p>
            </div>
          </div>
        </div>
      </div>

      {/* Completion Ring */}
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-6">
        <h2 className="text-base font-semibold text-[var(--text-primary)] mb-4">
          Overall Progress
        </h2>
        <div className="flex items-center gap-8">
          <div className="relative w-32 h-32 flex-shrink-0">
            <svg className="w-32 h-32 -rotate-90" viewBox="0 0 128 128">
              <circle cx="64" cy="64" r="56" fill="none" stroke="var(--border)" strokeWidth="12" />
              <circle
                cx="64" cy="64" r="56" fill="none"
                stroke="url(#gradient)"
                strokeWidth="12"
                strokeLinecap="round"
                strokeDasharray={`${completionRate * 3.52} 352`}
                className="transition-all duration-1000"
              />
              <defs>
                <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#6366F1" />
                  <stop offset="100%" stopColor="#8B5CF6" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-2xl font-bold text-[var(--text-primary)]">{completionRate}%</span>
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-sm text-[var(--text-secondary)]">
              You&apos;ve completed <span className="font-semibold text-[var(--text-primary)]">{completedTasks}</span> out of <span className="font-semibold text-[var(--text-primary)]">{totalTasks}</span> tasks.
            </p>
            {completionRate >= 80 && (
              <p className="text-sm text-emerald-600 dark:text-emerald-400 font-medium">
                Great job! You&apos;re almost there.
              </p>
            )}
            {completionRate < 50 && totalTasks > 0 && (
              <p className="text-sm text-amber-600 dark:text-amber-400 font-medium">
                Keep going! Focus on high-priority tasks first.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({
  icon: Icon,
  iconBg,
  iconColor,
  value,
  suffix,
  label,
}: {
  icon: React.ComponentType<{ className?: string }>;
  iconBg: string;
  iconColor: string;
  value: number;
  suffix?: string;
  label: string;
}) {
  return (
    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4 hover:shadow-sm transition-all">
      <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center mb-3", iconBg)}>
        <Icon className={cn("w-4.5 h-4.5", iconColor)} />
      </div>
      <p className="text-2xl font-bold text-[var(--text-primary)]">
        {value}{suffix}
      </p>
      <p className="text-xs text-[var(--text-muted)] mt-0.5">{label}</p>
    </div>
  );
}

function PriorityBar({
  label,
  count,
  total,
  color,
}: {
  label: string;
  count: number;
  total: number;
  color: string;
}) {
  const percentage = total > 0 ? (count / total) * 100 : 0;
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm text-[var(--text-secondary)]">{label}</span>
        <span className="text-sm font-semibold text-[var(--text-primary)]">{count}</span>
      </div>
      <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all duration-500", color)}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

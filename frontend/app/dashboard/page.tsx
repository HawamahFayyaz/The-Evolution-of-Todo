/**
 * Dashboard page component - DoNext Premium.
 *
 * Main dashboard with welcome greeting, stat cards, and today's focus.
 */

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Dashboard - DoNext",
  description: "Your personal task management dashboard",
};

export default async function DashboardPage() {
  // Get user session for greeting
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  const userName = session?.user?.name?.split(" ")[0] || "there";

  // Get current hour for greeting
  const hour = new Date().getHours();
  let greeting = "Good morning";
  if (hour >= 12 && hour < 17) greeting = "Good afternoon";
  else if (hour >= 17) greeting = "Good evening";

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          {greeting}, {userName}! 👋
        </h1>
        <p className="mt-1 text-gray-600">
          You have tasks waiting for you. Let&apos;s get things done!
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatCard
          emoji="📋"
          value={0}
          label="Total Tasks"
          trend={{ value: 0, direction: "up" }}
        />
        <StatCard
          emoji="✅"
          value={0}
          label="Completed"
          trend={{ value: 0, direction: "up" }}
        />
        <StatCard
          emoji="⏰"
          value={0}
          label="Pending"
          trend={{ value: 0, direction: "down" }}
        />
      </div>

      {/* Today's Focus Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">🔥 Today&apos;s Focus</h2>
          <Link
            href="/dashboard/tasks"
            className="text-sm font-medium text-indigo-600 hover:text-indigo-500 transition-colors"
          >
            View all →
          </Link>
        </div>

        {/* Empty state */}
        <div className="text-center py-8">
          <div className="text-4xl text-gray-300 mb-3">📋</div>
          <p className="text-gray-500 mb-4">No tasks for today yet</p>
          <Link href="/dashboard/tasks">
            <Button variant="gradient" size="sm">
              + Create your first task
            </Button>
          </Link>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="flex flex-wrap gap-3">
          <Link href="/dashboard/tasks">
            <Button variant="gradient">
              + New Task
            </Button>
          </Link>
          <Link href="/dashboard/tasks">
            <Button variant="secondary">
              View All Tasks
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

/**
 * Premium Stat Card Component
 */
function StatCard({
  emoji,
  value,
  label,
  trend,
}: {
  emoji: string;
  value: number;
  label: string;
  trend?: { value: number; direction: "up" | "down" };
}) {
  return (
    <div className="bg-white rounded-xl p-6 border-2 border-transparent hover:border-indigo-500 transition-all duration-300 cursor-pointer relative overflow-hidden gradient-border shadow-sm">
      <div className="text-3xl mb-2">{emoji}</div>
      <div className="text-4xl font-bold text-gray-900">{value}</div>
      <div className="text-sm text-gray-600 uppercase tracking-wide mt-1">
        {label}
      </div>
      {trend && trend.value > 0 && (
        <div
          className={`text-sm font-semibold mt-2 ${
            trend.direction === "up" ? "text-emerald-600" : "text-red-600"
          }`}
        >
          {trend.direction === "up" ? "↑" : "↓"} {trend.value}%
        </div>
      )}
    </div>
  );
}

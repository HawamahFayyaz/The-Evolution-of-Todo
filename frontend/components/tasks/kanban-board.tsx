"use client";

import type { Task } from "@/types";
import { cn } from "@/lib/utils";
import { Check, Clock, Circle, Flag } from "lucide-react";

interface KanbanBoardProps {
  tasks: Task[];
  onToggle: (taskId: number) => Promise<unknown>;
  onEdit: (task: Task) => void;
}

type KanbanColumn = "todo" | "in-progress" | "done";

const COLUMNS: { id: KanbanColumn; label: string; icon: React.ComponentType<{ className?: string }>; color: string; bg: string }[] = [
  { id: "todo", label: "To Do", icon: Circle, color: "text-slate-500", bg: "bg-slate-50 dark:bg-slate-800/50" },
  { id: "in-progress", label: "In Progress", icon: Clock, color: "text-amber-500", bg: "bg-amber-50/50 dark:bg-amber-900/10" },
  { id: "done", label: "Done", icon: Check, color: "text-emerald-500", bg: "bg-emerald-50/50 dark:bg-emerald-900/10" },
];

const PRIORITY_COLORS: Record<string, string> = {
  low: "border-l-slate-300",
  medium: "border-l-amber-400",
  high: "border-l-red-500",
};

export function KanbanBoard({ tasks, onEdit }: KanbanBoardProps) {
  const getColumnTasks = (col: KanbanColumn): Task[] => {
    switch (col) {
      case "todo":
        return tasks.filter((t) => !t.completed && t.priority !== "high");
      case "in-progress":
        return tasks.filter((t) => !t.completed && t.priority === "high");
      case "done":
        return tasks.filter((t) => t.completed);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {COLUMNS.map((col) => {
        const columnTasks = getColumnTasks(col.id);
        return (
          <div key={col.id} className={cn("rounded-xl p-3 min-h-[200px]", col.bg)}>
            {/* Column header */}
            <div className="flex items-center gap-2 mb-3 px-1">
              <col.icon className={cn("w-4 h-4", col.color)} />
              <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                {col.label}
              </h3>
              <span className="ml-auto text-xs font-medium text-[var(--text-muted)] bg-[var(--surface)] px-2 py-0.5 rounded-full">
                {columnTasks.length}
              </span>
            </div>

            {/* Cards */}
            <div className="space-y-2">
              {columnTasks.map((task) => (
                <button
                  key={task.id}
                  onClick={() => onEdit(task)}
                  className={cn(
                    "w-full text-left p-3 bg-[var(--surface)] rounded-lg border border-[var(--border)] hover:border-indigo-300 dark:hover:border-indigo-600 hover:shadow-sm transition-all cursor-pointer border-l-[3px]",
                    PRIORITY_COLORS[task.priority] || "border-l-slate-200",
                    task.completed && "opacity-60"
                  )}
                >
                  <p className={cn(
                    "text-sm font-medium text-[var(--text-primary)] line-clamp-2",
                    task.completed && "line-through"
                  )}>
                    {task.title}
                  </p>
                  {task.description && (
                    <p className="text-xs text-[var(--text-muted)] mt-1 line-clamp-1">
                      {task.description}
                    </p>
                  )}
                  <div className="flex items-center gap-2 mt-2">
                    <span className={cn(
                      "inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded",
                      task.priority === "high" ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" :
                      task.priority === "medium" ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" :
                      "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400"
                    )}>
                      <Flag className="w-2.5 h-2.5" />
                      {task.priority}
                    </span>
                    {task.dueDate && (
                      <span className="text-[10px] text-[var(--text-muted)]">
                        {new Date(task.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </span>
                    )}
                  </div>
                </button>
              ))}
              {columnTasks.length === 0 && (
                <p className="text-center py-8 text-xs text-[var(--text-muted)]">
                  No tasks
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

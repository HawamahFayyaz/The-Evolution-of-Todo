"use client";

import { useState } from "react";
import type { Task, TaskPriority } from "@/types";
import { cn } from "@/lib/utils";
import { Check, Pencil, Trash2, Calendar, Flag, Repeat } from "lucide-react";

interface TaskItemProps {
  task: Task;
  onToggle: (taskId: number) => Promise<void>;
  onEdit: (task: Task) => void;
  onDelete: () => void;
}

const PRIORITY_CONFIG: Record<TaskPriority, { label: string; color: string; iconColor: string }> = {
  low: { label: "Low", color: "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400", iconColor: "text-slate-400" },
  medium: { label: "Medium", color: "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400", iconColor: "text-amber-500" },
  high: { label: "High", color: "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400", iconColor: "text-red-500" },
};

const RECURRENCE_LABELS: Record<string, string> = {
  daily: "Daily",
  weekly: "Weekly",
  monthly: "Monthly",
};

const TAG_COLORS = [
  "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400",
  "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400",
];

function getTagColor(tag: string): string {
  let hash = 0;
  for (let i = 0; i < tag.length; i++) hash = tag.charCodeAt(i) + ((hash << 5) - hash);
  return TAG_COLORS[Math.abs(hash) % TAG_COLORS.length];
}

function isOverdue(dateStr: string | null): boolean {
  if (!dateStr) return false;
  const dueDate = new Date(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return dueDate < today;
}

function formatDueDate(dateStr: string | null): string {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  let label: string;
  if (date.toDateString() === today.toDateString()) label = "Today";
  else if (date.toDateString() === tomorrow.toDateString()) label = "Tomorrow";
  else label = date.toLocaleDateString("en-US", { month: "short", day: "numeric" });

  // Include time if not midnight
  const hours = date.getHours();
  const minutes = date.getMinutes();
  if (hours !== 23 || minutes !== 59) {
    const timeStr = date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
    label += ` ${timeStr}`;
  }

  return label;
}

export function TaskItem({ task, onToggle, onEdit, onDelete }: TaskItemProps) {
  const [toggling, setToggling] = useState(false);
  const priorityConfig = PRIORITY_CONFIG[task.priority];
  const overdue = !task.completed && isOverdue(task.dueDate);

  async function handleToggle() {
    setToggling(true);
    try {
      await onToggle(task.id);
    } finally {
      setToggling(false);
    }
  }

  return (
    <div
      className={cn(
        "group relative flex items-start gap-3.5 p-4 rounded-xl border transition-all duration-200",
        task.completed
          ? "bg-[var(--surface-secondary)] border-[var(--border)] opacity-70"
          : "bg-[var(--surface)] border-[var(--border)] hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-sm"
      )}
    >
      {/* Checkbox */}
      <button
        onClick={handleToggle}
        disabled={toggling}
        className={cn(
          "mt-0.5 w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all duration-200 flex-shrink-0 cursor-pointer",
          task.completed
            ? "bg-indigo-600 border-indigo-600"
            : "border-[var(--border-hover)] hover:border-indigo-500",
          toggling && "opacity-50"
        )}
        aria-label={task.completed ? "Mark as incomplete" : "Mark as complete"}
      >
        {task.completed && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
      </button>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <h3
          className={cn(
            "text-sm font-medium leading-tight",
            task.completed ? "line-through text-[var(--text-muted)]" : "text-[var(--text-primary)]"
          )}
        >
          {task.title}
        </h3>
        {task.description && (
          <p
            className={cn(
              "mt-1 text-[13px] line-clamp-2 leading-relaxed",
              task.completed ? "text-[var(--text-muted)] line-through" : "text-[var(--text-secondary)]"
            )}
          >
            {task.description}
          </p>
        )}

        {/* Metadata */}
        <div className="flex items-center flex-wrap gap-2 mt-2.5">
          {/* Priority */}
          <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium", priorityConfig.color)}>
            <Flag className={cn("w-3 h-3", priorityConfig.iconColor)} />
            {priorityConfig.label}
          </span>

          {/* Due date */}
          {task.dueDate && (
            <span
              className={cn(
                "inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium",
                overdue
                  ? "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                  : "bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400"
              )}
            >
              <Calendar className="w-3 h-3" />
              {formatDueDate(task.dueDate)}
              {overdue && " (Overdue)"}
            </span>
          )}

          {/* Recurrence badge */}
          {task.recurrencePattern && task.recurrencePattern !== "none" && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-violet-50 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400">
              <Repeat className="w-3 h-3" />
              {RECURRENCE_LABELS[task.recurrencePattern]}
            </span>
          )}

          {/* Tags */}
          {task.tags && task.tags.length > 0 && task.tags.map(tag => (
            <span
              key={tag}
              className={cn("inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium", getTagColor(tag))}
            >
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={() => onEdit(task)}
          className="p-1.5 rounded-md text-[var(--text-muted)] hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors"
          aria-label="Edit task"
        >
          <Pencil className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={onDelete}
          className="p-1.5 rounded-md text-[var(--text-muted)] hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          aria-label="Delete task"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

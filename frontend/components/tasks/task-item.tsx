/**
 * Task item component - DoNext Premium.
 *
 * Displays a single task with premium checkbox, hover effects,
 * priority badge, due date, and edit/delete actions.
 */

"use client";

import { useState } from "react";
import type { Task, TaskPriority } from "@/types";
import { Button } from "@/components/ui/button";

interface TaskItemProps {
  task: Task;
  onToggle: (taskId: number) => Promise<void>;
  onEdit: (task: Task) => void;
  /** Called when delete button is clicked - parent handles confirmation */
  onDelete: () => void;
}

/** Priority badge configuration */
const PRIORITY_CONFIG: Record<TaskPriority, { label: string; className: string }> = {
  low: { label: "Low", className: "bg-gray-100 text-gray-600" },
  medium: { label: "Medium", className: "bg-amber-100 text-amber-700" },
  high: { label: "High", className: "bg-red-100 text-red-700" },
};

/** Check if a date is overdue */
function isOverdue(dateStr: string | null): boolean {
  if (!dateStr) return false;
  const dueDate = new Date(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return dueDate < today;
}

/** Format due date for display */
function formatDueDate(dateStr: string | null): string {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  if (date.toDateString() === today.toDateString()) {
    return "Today";
  }
  if (date.toDateString() === tomorrow.toDateString()) {
    return "Tomorrow";
  }
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function TaskItem({ task, onToggle, onEdit, onDelete }: TaskItemProps) {
  const [toggling, setToggling] = useState(false);

  async function handleToggle() {
    setToggling(true);
    try {
      await onToggle(task.id);
    } finally {
      setToggling(false);
    }
  }

  function handleDelete() {
    // Confirmation is handled by parent component via ConfirmDialog
    onDelete();
  }

  return (
    <div
      className={`group flex items-start gap-4 p-5 border-b border-gray-100 last:border-b-0 transition-all duration-200 hover:bg-gray-50 ${
        task.completed ? "bg-gray-50/50 opacity-75" : ""
      }`}
    >
      {/* Premium Checkbox */}
      <button
        onClick={handleToggle}
        disabled={toggling}
        className={`mt-0.5 w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all duration-200 ${
          task.completed
            ? "bg-gradient-to-br from-indigo-500 to-purple-600 border-indigo-500 scale-105"
            : "border-gray-300 hover:border-indigo-500 hover:scale-105"
        } ${toggling ? "opacity-50" : ""}`}
        aria-label={task.completed ? "Mark as incomplete" : "Mark as complete"}
      >
        {task.completed && (
          <svg
            className="w-3.5 h-3.5 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={3}
              d="M5 13l4 4L19 7"
            />
          </svg>
        )}
      </button>

      {/* Task content */}
      <div className="flex-1 min-w-0">
        <h3
          className={`text-lg font-semibold transition-colors ${
            task.completed ? "line-through text-gray-400" : "text-gray-900"
          }`}
        >
          {task.title}
        </h3>
        {task.description && (
          <p
            className={`mt-1 text-sm line-clamp-2 ${
              task.completed ? "text-gray-400 line-through" : "text-gray-600"
            }`}
          >
            {task.description}
          </p>
        )}

        {/* Metadata row */}
        <div className="flex items-center flex-wrap gap-2 mt-3">
          {/* Status badge */}
          {task.completed ? (
            <span className="bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full text-xs font-medium">
              Completed
            </span>
          ) : (
            <span className="bg-gray-100 text-gray-700 px-2.5 py-0.5 rounded-full text-xs font-medium">
              Pending
            </span>
          )}

          {/* Priority badge */}
          <span
            className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${PRIORITY_CONFIG[task.priority].className}`}
          >
            {PRIORITY_CONFIG[task.priority].label}
          </span>

          {/* Due date badge */}
          {task.dueDate && (
            <span
              className={`px-2.5 py-0.5 rounded-full text-xs font-medium flex items-center gap-1 ${
                !task.completed && isOverdue(task.dueDate)
                  ? "bg-red-100 text-red-700"
                  : "bg-indigo-100 text-indigo-700"
              }`}
            >
              <svg
                className="w-3 h-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              {formatDueDate(task.dueDate)}
              {!task.completed && isOverdue(task.dueDate) && " (Overdue)"}
            </span>
          )}

          {/* Created date */}
          <span className="text-xs text-gray-400">
            Created {new Date(task.createdAt).toLocaleDateString()}
          </span>
        </div>
      </div>

      {/* Actions - appear on hover */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onEdit(task)}
          aria-label="Edit task"
          className="text-gray-500 hover:text-indigo-600"
        >
          Edit
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleDelete}
          className="text-gray-500 hover:text-red-600 hover:bg-red-50"
          aria-label="Delete task"
        >
          Delete
        </Button>
      </div>
    </div>
  );
}

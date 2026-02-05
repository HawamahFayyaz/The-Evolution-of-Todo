/**
 * Task form component.
 *
 * Handles creating and editing tasks with priority and due date.
 */

"use client";

import { useState } from "react";
import type { Task, TaskPriority } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

/** Form data structure (compatible with both create and update) */
interface TaskFormData {
  title: string;
  description: string;
  priority: TaskPriority;
  due_date: string | null;
}

/** Priority options for the dropdown */
const PRIORITY_OPTIONS: { value: TaskPriority; label: string; color: string }[] = [
  { value: "low", label: "Low", color: "text-gray-500" },
  { value: "medium", label: "Medium", color: "text-amber-600" },
  { value: "high", label: "High", color: "text-red-600" },
];

interface TaskFormProps {
  /** Task to edit, or undefined for create mode */
  task?: Task;
  /** Callback when form is submitted */
  onSubmit: (data: TaskFormData) => Promise<void>;
  /** Callback when form is cancelled */
  onCancel?: () => void;
  /** Whether the form is submitting */
  loading?: boolean;
}

/** Convert datetime string to date input format (YYYY-MM-DD) */
function toDateInputValue(datetime: string | null): string {
  if (!datetime) return "";
  try {
    return datetime.split("T")[0];
  } catch {
    return "";
  }
}

/** Convert date input value to ISO datetime string */
function toISODateTime(dateValue: string): string | null {
  if (!dateValue) return null;
  // Set time to end of day in UTC
  return `${dateValue}T23:59:59Z`;
}

export function TaskForm({ task, onSubmit, onCancel, loading }: TaskFormProps) {
  const [title, setTitle] = useState(task?.title ?? "");
  const [description, setDescription] = useState(task?.description ?? "");
  const [priority, setPriority] = useState<TaskPriority>(task?.priority ?? "medium");
  const [dueDate, setDueDate] = useState(toDateInputValue(task?.dueDate ?? null));
  const [error, setError] = useState<string | null>(null);

  const isEditing = !!task;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError("Title is required");
      return;
    }

    if (title.length > 200) {
      setError("Title must be 200 characters or less");
      return;
    }

    try {
      await onSubmit({
        title: title.trim(),
        description: description.trim(),
        priority,
        due_date: toISODateTime(dueDate),
      });
      // Reset form on success for create mode
      if (!isEditing) {
        setTitle("");
        setDescription("");
        setPriority("medium");
        setDueDate("");
      }
    } catch (err) {
      setError("Failed to save task. Please try again.");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      <Input
        label="Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="What needs to be done?"
        required
        autoFocus={!isEditing}
        maxLength={200}
      />

      <div className="space-y-1">
        <label className="block text-sm font-medium text-gray-700">
          Description (optional)
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Add more details..."
          className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
          rows={3}
          maxLength={1000}
        />
      </div>

      {/* Priority and Due Date Row */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700">
            Priority
          </label>
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value as TaskPriority)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
          >
            {PRIORITY_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700">
            Due Date (optional)
          </label>
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            min={new Date().toISOString().split("T")[0]}
          />
        </div>
      </div>

      <div className="flex items-center gap-3 pt-2">
        <Button type="submit" disabled={loading}>
          {loading ? "Saving..." : isEditing ? "Save Changes" : "Add Task"}
        </Button>
        {onCancel && (
          <Button type="button" variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}

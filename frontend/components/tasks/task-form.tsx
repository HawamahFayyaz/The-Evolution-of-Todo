/**
 * Task form component.
 *
 * Handles creating and editing tasks.
 */

"use client";

import { useState } from "react";
import type { CreateTaskData, Task, UpdateTaskData } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

/** Form data structure (compatible with both create and update) */
interface TaskFormData {
  title: string;
  description: string;
}

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

export function TaskForm({ task, onSubmit, onCancel, loading }: TaskFormProps) {
  const [title, setTitle] = useState(task?.title ?? "");
  const [description, setDescription] = useState(task?.description ?? "");
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
      });
      // Reset form on success for create mode
      if (!isEditing) {
        setTitle("");
        setDescription("");
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

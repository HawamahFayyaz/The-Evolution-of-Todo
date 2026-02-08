"use client";

import { useState } from "react";
import type { Task, TaskPriority, RecurrencePattern } from "@/types";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";


interface TaskFormData {
  title: string;
  description: string;
  priority: TaskPriority;
  due_date: string | null;
  tags: string[];
  recurrence_pattern: RecurrencePattern;
}

const PRIORITY_OPTIONS: { value: TaskPriority; label: string; color: string }[] = [
  { value: "low", label: "Low", color: "text-slate-500" },
  { value: "medium", label: "Medium", color: "text-amber-600" },
  { value: "high", label: "High", color: "text-red-600" },
];

const RECURRENCE_OPTIONS: { value: RecurrencePattern; label: string }[] = [
  { value: "none", label: "No repeat" },
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
];

interface TaskFormProps {
  task?: Task;
  onSubmit: (data: TaskFormData) => Promise<void>;
  onCancel?: () => void;
  loading?: boolean;
}

function toDateTimeInputValue(datetime: string | null): string {
  if (!datetime) return "";
  try {
    const d = new Date(datetime);
    // Format as YYYY-MM-DDTHH:MM for datetime-local input
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const hours = String(d.getHours()).padStart(2, "0");
    const minutes = String(d.getMinutes()).padStart(2, "0");
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  } catch {
    return "";
  }
}

function toISODateTime(dateTimeValue: string): string | null {
  if (!dateTimeValue) return null;
  // datetime-local gives us YYYY-MM-DDTHH:MM
  return new Date(dateTimeValue).toISOString();
}

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

export function TaskForm({ task, onSubmit, onCancel, loading }: TaskFormProps) {
  const [title, setTitle] = useState(task?.title ?? "");
  const [description, setDescription] = useState(task?.description ?? "");
  const [priority, setPriority] = useState<TaskPriority>(task?.priority ?? "medium");
  const [dueDate, setDueDate] = useState(toDateTimeInputValue(task?.dueDate ?? null));
  const [tags, setTags] = useState<string[]>(task?.tags ?? []);
  const [tagInput, setTagInput] = useState("");
  const [recurrence, setRecurrence] = useState<RecurrencePattern>(task?.recurrencePattern ?? "none");
  const [error, setError] = useState<string | null>(null);

  const isEditing = !!task;

  function handleAddTag(value: string) {
    const tag = value.trim().toLowerCase();
    if (tag && !tags.includes(tag) && tags.length < 10) {
      setTags([...tags, tag]);
    }
    setTagInput("");
  }

  function handleRemoveTag(tag: string) {
    setTags(tags.filter(t => t !== tag));
  }

  function handleTagKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddTag(tagInput);
    } else if (e.key === "Backspace" && !tagInput && tags.length > 0) {
      setTags(tags.slice(0, -1));
    }
  }

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
        tags,
        recurrence_pattern: recurrence,
      });
      if (!isEditing) {
        setTitle("");
        setDescription("");
        setPriority("medium");
        setDueDate("");
        setTags([]);
        setTagInput("");
        setRecurrence("none");
      }
    } catch {
      setError("Failed to save task. Please try again.");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-100 text-red-700 px-3 py-2 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div className="space-y-1.5">
        <label className="block text-sm font-medium text-[var(--text-secondary)]">Title</label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="What needs to be done?"
          required
          autoFocus={!isEditing}
          maxLength={200}
          className="w-full px-3 py-2.5 text-sm border border-[var(--border)] rounded-xl bg-[var(--surface)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-shadow"
        />
      </div>

      <div className="space-y-1.5">
        <label className="block text-sm font-medium text-[var(--text-secondary)]">
          Description <span className="text-[var(--text-muted)] font-normal">(optional)</span>
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Add more details..."
          className="w-full px-3 py-2.5 text-sm border border-[var(--border)] rounded-xl bg-[var(--surface)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 resize-none transition-shadow"
          rows={3}
          maxLength={1000}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-[var(--text-secondary)]">Priority</label>
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value as TaskPriority)}
            className="w-full px-3 py-2.5 text-sm border border-[var(--border)] rounded-xl bg-[var(--surface)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-shadow"
          >
            {PRIORITY_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-[var(--text-secondary)]">
            Due Date <span className="text-[var(--text-muted)] font-normal">(optional)</span>
          </label>
          <input
            type="datetime-local"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="w-full px-3 py-2.5 text-sm border border-[var(--border)] rounded-xl bg-[var(--surface)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-shadow"
          />
        </div>
      </div>

      {/* Recurrence */}
      <div className="space-y-1.5">
        <label className="block text-sm font-medium text-[var(--text-secondary)]">Repeat</label>
        <select
          value={recurrence}
          onChange={(e) => setRecurrence(e.target.value as RecurrencePattern)}
          className="w-full px-3 py-2.5 text-sm border border-[var(--border)] rounded-xl bg-[var(--surface)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-shadow"
        >
          {RECURRENCE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {/* Tags */}
      <div className="space-y-1.5">
        <label className="block text-sm font-medium text-[var(--text-secondary)]">
          Tags <span className="text-[var(--text-muted)] font-normal">(optional, press Enter to add)</span>
        </label>
        <div className="flex flex-wrap gap-1.5 min-h-[40px] px-3 py-2 border border-[var(--border)] rounded-xl bg-[var(--surface)] focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-400 transition-shadow">
          {tags.map(tag => (
            <span
              key={tag}
              className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium", getTagColor(tag))}
            >
              {tag}
              <button
                type="button"
                onClick={() => handleRemoveTag(tag)}
                className="hover:opacity-70"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
          <input
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={handleTagKeyDown}
            onBlur={() => { if (tagInput.trim()) handleAddTag(tagInput); }}
            placeholder={tags.length === 0 ? "Type a tag..." : ""}
            className="flex-1 min-w-[80px] text-sm bg-transparent text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none"
          />
        </div>
      </div>

      <div className="flex items-center gap-3 pt-1">
        <Button type="submit" disabled={loading} size="sm">
          {loading ? "Saving..." : isEditing ? "Save Changes" : "Add Task"}
        </Button>
        {onCancel && (
          <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}

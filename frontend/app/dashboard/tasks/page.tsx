"use client";

import { useState } from "react";
import { TaskList } from "@/components/tasks/task-list";
import { KanbanBoard } from "@/components/tasks/kanban-board";
import { useTasks } from "@/hooks/use-tasks";
import { cn } from "@/lib/utils";
import { List, LayoutGrid } from "lucide-react";
import type { Task } from "@/types";

type ViewMode = "list" | "kanban";

export default function TasksPage() {
  const [view, setView] = useState<ViewMode>("list");
  const { tasks, toggleTask } = useTasks();

  function handleEdit(_task: Task) {
    // Switch to list view for editing
    setView("list");
  }

  return (
    <div className="space-y-4">
      {/* View Toggle */}
      <div className="flex justify-end">
        <div className="flex gap-1 p-1 bg-[var(--surface-secondary)] border border-[var(--border)] rounded-lg">
          {([
            { value: "list" as ViewMode, icon: List, label: "List" },
            { value: "kanban" as ViewMode, icon: LayoutGrid, label: "Board" },
          ]).map(({ value, icon: Icon, label }) => (
            <button
              key={value}
              onClick={() => setView(value)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all",
                view === value
                  ? "bg-[var(--surface)] text-[var(--text-primary)] shadow-sm"
                  : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
              )}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {view === "list" ? (
        <TaskList />
      ) : (
        <KanbanBoard tasks={tasks} onToggle={toggleTask} onEdit={handleEdit} />
      )}
    </div>
  );
}

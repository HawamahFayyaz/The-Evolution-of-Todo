"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { Task } from "@/types";
import { cn } from "@/lib/utils";
import { useTasks } from "@/hooks/use-tasks";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { TaskItem } from "./task-item";
import { TaskForm } from "./task-form";
import { Plus, Search, X, CheckCircle, ClipboardList, RotateCcw } from "lucide-react";

type FilterType = "all" | "active" | "completed";

function TaskSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex items-start gap-3.5 p-4 rounded-xl border border-[var(--border)] bg-[var(--surface)]">
          <div className="w-5 h-5 rounded-md skeleton flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-2/3 skeleton" />
            <div className="h-3 w-1/3 skeleton" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function TaskList() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const filterParam = searchParams.get("filter") as FilterType | null;
  const [filter, setFilter] = useState<FilterType>(
    filterParam && ["all", "active", "completed"].includes(filterParam)
      ? filterParam
      : "all"
  );

  const {
    tasks,
    total,
    loading,
    error,
    refresh,
    search,
    clearSearch,
    createTask,
    updateTask,
    deleteTask,
    toggleTask,
  } = useTasks();

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleSearchChange = useCallback(
    (value: string) => {
      setSearchQuery(value);
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
      searchTimeoutRef.current = setTimeout(async () => {
        if (value.trim()) {
          setIsSearching(true);
          await search(value);
        } else {
          setIsSearching(false);
          await clearSearch();
        }
      }, 300);
    },
    [search, clearSearch]
  );

  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, []);

  function handleClearSearch() {
    setSearchQuery("");
    setIsSearching(false);
    clearSearch();
  }

  useEffect(() => {
    const currentFilter = searchParams.get("filter");
    if (currentFilter !== filter) {
      const params = new URLSearchParams(searchParams.toString());
      if (filter === "all") {
        params.delete("filter");
      } else {
        params.set("filter", filter);
      }
      const newUrl = params.toString() ? `?${params.toString()}` : window.location.pathname;
      router.replace(newUrl, { scroll: false });
    }
  }, [filter, router, searchParams]);

  async function handleCreate(data: { title: string; description: string }) {
    setFormLoading(true);
    try {
      const result = await createTask(data);
      if (result) setShowCreateForm(false);
    } finally {
      setFormLoading(false);
    }
  }

  async function handleUpdate(data: { title: string; description: string }) {
    if (!editingTask) return;
    setFormLoading(true);
    try {
      const result = await updateTask(editingTask.id, data);
      if (result) setEditingTask(null);
    } finally {
      setFormLoading(false);
    }
  }

  async function handleToggle(taskId: number) {
    await toggleTask(taskId);
  }

  async function handleConfirmDelete() {
    if (!taskToDelete) return;
    setDeleteLoading(true);
    try {
      await deleteTask(taskToDelete.id);
      setTaskToDelete(null);
    } finally {
      setDeleteLoading(false);
    }
  }

  const filteredTasks = tasks.filter((t) => {
    if (filter === "active") return !t.completed;
    if (filter === "completed") return t.completed;
    return true;
  });

  const incompleteTasks = filteredTasks.filter((t) => !t.completed);
  const completedTasks = filteredTasks.filter((t) => t.completed);

  const filterTabs: { value: FilterType; label: string; count: number }[] = [
    { value: "all", label: "All", count: tasks.length },
    { value: "active", label: "Active", count: tasks.filter((t) => !t.completed).length },
    { value: "completed", label: "Done", count: tasks.filter((t) => t.completed).length },
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-[var(--text-primary)]">My Tasks</h2>
          <p className="text-sm text-[var(--text-secondary)] mt-0.5">
            {total === 0
              ? "No tasks yet"
              : `${total} task${total === 1 ? "" : "s"} \u00B7 ${tasks.filter((t) => !t.completed).length} remaining`}
          </p>
        </div>
        {!showCreateForm && !editingTask && (
          <Button variant="gradient" size="sm" onClick={() => setShowCreateForm(true)}>
            <Plus className="w-4 h-4" />
            New Task
          </Button>
        )}
      </div>

      {/* Search + Filters */}
      {(tasks.length > 0 || isSearching) && (
        <div className="space-y-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)] pointer-events-none" />
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full pl-9 pr-9 py-2.5 text-sm border border-[var(--border)] rounded-xl bg-[var(--surface)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-shadow"
            />
            {searchQuery && (
              <button
                onClick={handleClearSearch}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Filter Tabs */}
          {!isSearching && (
            <div className="flex gap-1 p-1 bg-[var(--surface-secondary)] rounded-xl">
              {filterTabs.map((tab) => (
                <button
                  key={tab.value}
                  onClick={() => setFilter(tab.value)}
                  className={cn(
                    "flex-1 px-3 py-1.5 text-sm font-medium rounded-lg transition-all cursor-pointer",
                    filter === tab.value
                      ? "bg-[var(--surface)] text-[var(--text-primary)] shadow-sm"
                      : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
                  )}
                >
                  {tab.label}
                  <span
                    className={cn(
                      "ml-1.5 text-[11px] px-1.5 py-0.5 rounded-full",
                      filter === tab.value
                        ? "bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400"
                        : "bg-[var(--surface-secondary)] text-[var(--text-muted)]"
                    )}
                  >
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>
          )}

          {isSearching && (
            <p className="text-sm text-[var(--text-secondary)]">
              Found {filteredTasks.length} result{filteredTasks.length !== 1 ? "s" : ""} for &quot;{searchQuery}&quot;
            </p>
          )}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-center justify-between bg-red-50 border border-red-100 text-red-700 px-4 py-3 rounded-xl text-sm">
          <p>{error}</p>
          <button onClick={refresh} className="inline-flex items-center gap-1 text-sm font-medium hover:underline">
            <RotateCcw className="w-3.5 h-3.5" />
            Retry
          </button>
        </div>
      )}

      {/* Create form */}
      {showCreateForm && (
        <div className="bg-[var(--surface)] border-2 border-indigo-200 dark:border-indigo-800 rounded-xl p-5 shadow-sm animate-fade-in">
          <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4">New Task</h3>
          <TaskForm
            onSubmit={handleCreate}
            onCancel={() => setShowCreateForm(false)}
            loading={formLoading}
          />
        </div>
      )}

      {/* Edit form */}
      {editingTask && (
        <div className="bg-[var(--surface)] border-2 border-indigo-200 dark:border-indigo-800 rounded-xl p-5 shadow-sm animate-fade-in">
          <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4">Edit Task</h3>
          <TaskForm
            task={editingTask}
            onSubmit={handleUpdate}
            onCancel={() => setEditingTask(null)}
            loading={formLoading}
          />
        </div>
      )}

      {/* Loading skeleton */}
      {loading && <TaskSkeleton />}

      {/* Task list */}
      {!loading && filteredTasks.length > 0 && (
        <div className="space-y-6">
          {filter === "all" ? (
            <>
              {incompleteTasks.length > 0 && (
                <div className="space-y-2">
                  {incompleteTasks.map((task) => (
                    <TaskItem
                      key={task.id}
                      task={task}
                      onToggle={handleToggle}
                      onEdit={(t) => {
                        setEditingTask(t);
                        setShowCreateForm(false);
                      }}
                      onDelete={() => setTaskToDelete(task)}
                    />
                  ))}
                </div>
              )}

              {completedTasks.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="w-4 h-4 text-emerald-500" />
                    <span className="text-sm font-medium text-[var(--text-muted)]">
                      Completed ({completedTasks.length})
                    </span>
                  </div>
                  <div className="space-y-2">
                    {completedTasks.map((task) => (
                      <TaskItem
                        key={task.id}
                        task={task}
                        onToggle={handleToggle}
                        onEdit={(t) => {
                          setEditingTask(t);
                          setShowCreateForm(false);
                        }}
                        onDelete={() => setTaskToDelete(task)}
                      />
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="space-y-2">
              {filteredTasks.map((task) => (
                <TaskItem
                  key={task.id}
                  task={task}
                  onToggle={handleToggle}
                  onEdit={(t) => {
                    setEditingTask(t);
                    setShowCreateForm(false);
                  }}
                  onDelete={() => setTaskToDelete(task)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Empty states */}
      {!loading && tasks.length === 0 && !showCreateForm && (
        <div className="text-center py-16 bg-[var(--surface)] border border-[var(--border)] rounded-xl">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-[var(--surface-secondary)] flex items-center justify-center">
            <ClipboardList className="w-8 h-8 text-[var(--text-muted)]" />
          </div>
          <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-1">No tasks yet</h3>
          <p className="text-sm text-[var(--text-secondary)] mb-6">Create your first task to get started</p>
          <Button variant="gradient" onClick={() => setShowCreateForm(true)}>
            <Plus className="w-4 h-4" />
            Create your first task
          </Button>
        </div>
      )}

      {!loading && tasks.length > 0 && filteredTasks.length === 0 && !showCreateForm && (
        <div className="text-center py-12 bg-[var(--surface)] border border-[var(--border)] rounded-xl">
          {isSearching ? (
            <>
              <Search className="w-10 h-10 text-[var(--text-muted)] mx-auto mb-3" />
              <h3 className="text-base font-semibold text-[var(--text-primary)] mb-1">No results found</h3>
              <p className="text-sm text-[var(--text-secondary)] mb-4">
                No tasks match &quot;{searchQuery}&quot;
              </p>
              <Button variant="outline" size="sm" onClick={handleClearSearch}>
                Clear search
              </Button>
            </>
          ) : (
            <>
              <div className="text-3xl mb-3">
                {filter === "active" ? (
                  <CheckCircle className="w-10 h-10 text-emerald-400 mx-auto" />
                ) : (
                  <ClipboardList className="w-10 h-10 text-[var(--text-muted)] mx-auto" />
                )}
              </div>
              <h3 className="text-base font-semibold text-[var(--text-primary)] mb-1">
                {filter === "active" ? "All tasks completed!" : "No completed tasks yet"}
              </h3>
              <p className="text-sm text-[var(--text-secondary)]">
                {filter === "active"
                  ? "Great job! You've completed all your tasks."
                  : "Complete some tasks to see them here."}
              </p>
            </>
          )}
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!taskToDelete}
        onClose={() => setTaskToDelete(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Task"
        message={
          taskToDelete ? (
            <p>
              Are you sure you want to delete{" "}
              <span className="font-semibold">&quot;{taskToDelete.title}&quot;</span>?
            </p>
          ) : null
        }
        confirmText="Delete"
        cancelText="Cancel"
        isLoading={deleteLoading}
        destructive
      />
    </div>
  );
}

/**
 * Task list component - DoNext Premium.
 *
 * Displays all tasks with create/edit/delete functionality.
 * Features premium card styling, filter tabs, and empty states.
 */

"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { Task } from "@/types";
import { useTasks } from "@/hooks/use-tasks";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { TaskItem } from "./task-item";
import { TaskForm } from "./task-form";

type FilterType = "all" | "active" | "completed";

export function TaskList() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Get filter from URL or default to "all"
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

  // Sync filter with URL when it changes
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

  // Handle filter change
  function handleFilterChange(newFilter: FilterType) {
    setFilter(newFilter);
  }

  async function handleCreate(data: { title: string; description: string }) {
    setFormLoading(true);
    try {
      const result = await createTask(data);
      if (result) {
        setShowCreateForm(false);
      }
    } finally {
      setFormLoading(false);
    }
  }

  async function handleUpdate(data: { title: string; description: string }) {
    if (!editingTask) return;
    setFormLoading(true);
    try {
      const result = await updateTask(editingTask.id, data);
      if (result) {
        setEditingTask(null);
      }
    } finally {
      setFormLoading(false);
    }
  }

  async function handleToggle(taskId: number) {
    await toggleTask(taskId);
  }

  function handleDeleteClick(task: Task) {
    setTaskToDelete(task);
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

  function handleCancelDelete() {
    setTaskToDelete(null);
  }

  function handleEdit(task: Task) {
    setEditingTask(task);
    setShowCreateForm(false);
  }

  function handleCancelEdit() {
    setEditingTask(null);
  }

  function handleCancelCreate() {
    setShowCreateForm(false);
  }

  // Filter tasks based on selected filter
  const filteredTasks = tasks.filter((t) => {
    if (filter === "active") return !t.completed;
    if (filter === "completed") return t.completed;
    return true; // "all"
  });

  // Separate completed and incomplete tasks for display
  const incompleteTasks = filteredTasks.filter((t) => !t.completed);
  const completedTasks = filteredTasks.filter((t) => t.completed);

  // Filter tab configuration
  const filterTabs: { value: FilterType; label: string; count: number }[] = [
    { value: "all", label: "All", count: tasks.length },
    { value: "active", label: "Active", count: tasks.filter((t) => !t.completed).length },
    { value: "completed", label: "Completed", count: tasks.filter((t) => t.completed).length },
  ];

  return (
    <div className="space-y-6">
      {/* Header with add button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">
            My Tasks
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            {total === 0
              ? "No tasks yet"
              : `${total} task${total === 1 ? "" : "s"} • ${tasks.filter((t) => !t.completed).length} remaining`}
          </p>
        </div>
        {!showCreateForm && !editingTask && (
          <Button variant="gradient" onClick={() => setShowCreateForm(true)}>
            + New Task
          </Button>
        )}
      </div>

      {/* Filter Tabs */}
      {tasks.length > 0 && (
        <div className="flex gap-1 p-1 bg-gray-100 rounded-xl">
          {filterTabs.map((tab) => (
            <button
              key={tab.value}
              onClick={() => handleFilterChange(tab.value)}
              className={`flex-1 px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                filter === tab.value
                  ? "bg-white text-indigo-600 shadow-sm"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              }`}
            >
              {tab.label}
              <span
                className={`ml-2 text-xs px-2 py-0.5 rounded-full ${
                  filter === tab.value
                    ? "bg-indigo-100 text-indigo-600"
                    : "bg-gray-200 text-gray-600"
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center justify-between">
          <p>{error}</p>
          <button
            onClick={refresh}
            className="text-sm font-medium underline hover:no-underline"
          >
            Try again
          </button>
        </div>
      )}

      {/* Create form */}
      {showCreateForm && (
        <Card className="border-2 border-indigo-200 shadow-lg">
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-900">New Task</h3>
          </CardHeader>
          <CardContent>
            <TaskForm
              onSubmit={handleCreate}
              onCancel={handleCancelCreate}
              loading={formLoading}
            />
          </CardContent>
        </Card>
      )}

      {/* Edit form */}
      {editingTask && (
        <Card className="border-2 border-indigo-200 shadow-lg">
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-900">Edit Task</h3>
          </CardHeader>
          <CardContent>
            <TaskForm
              task={editingTask}
              onSubmit={handleUpdate}
              onCancel={handleCancelEdit}
              loading={formLoading}
            />
          </CardContent>
        </Card>
      )}

      {/* Loading state */}
      {loading && (
        <Card>
          <CardContent className="py-12">
            <div className="flex flex-col items-center">
              <div className="animate-spin w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full mb-4" />
              <p className="text-gray-500">Loading tasks...</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Task list */}
      {!loading && filteredTasks.length > 0 && (
        <div className="space-y-6">
          {/* Show tasks based on filter */}
          {filter === "all" ? (
            <>
              {/* Incomplete tasks */}
              {incompleteTasks.length > 0 && (
                <Card className="overflow-hidden">
                  <CardContent className="p-0">
                    {incompleteTasks.map((task) => (
                      <TaskItem
                        key={task.id}
                        task={task}
                        onToggle={handleToggle}
                        onEdit={handleEdit}
                        onDelete={() => handleDeleteClick(task)}
                      />
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Completed tasks */}
              {completedTasks.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-3 flex items-center gap-2">
                    <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full text-xs">
                      ✓
                    </span>
                    Completed ({completedTasks.length})
                  </h3>
                  <Card className="overflow-hidden">
                    <CardContent className="p-0">
                      {completedTasks.map((task) => (
                        <TaskItem
                          key={task.id}
                          task={task}
                          onToggle={handleToggle}
                          onEdit={handleEdit}
                          onDelete={() => handleDeleteClick(task)}
                        />
                      ))}
                    </CardContent>
                  </Card>
                </div>
              )}
            </>
          ) : (
            /* Filtered view (active or completed only) */
            <Card className="overflow-hidden">
              <CardContent className="p-0">
                {filteredTasks.map((task) => (
                  <TaskItem
                    key={task.id}
                    task={task}
                    onToggle={handleToggle}
                    onEdit={handleEdit}
                    onDelete={() => handleDeleteClick(task)}
                  />
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Empty state - no tasks at all */}
      {!loading && tasks.length === 0 && !showCreateForm && (
        <Card>
          <CardContent className="py-16 text-center">
            <div className="text-6xl text-gray-300 mb-4">📋</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No tasks yet
            </h3>
            <p className="text-gray-500 mb-6">
              Create your first task to get started
            </p>
            <Button variant="gradient" onClick={() => setShowCreateForm(true)}>
              + Create your first task
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Empty state for filtered view */}
      {!loading && tasks.length > 0 && filteredTasks.length === 0 && !showCreateForm && (
        <Card>
          <CardContent className="py-12 text-center">
            <div className="text-5xl text-gray-300 mb-4">
              {filter === "active" ? "🎉" : "📝"}
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {filter === "active"
                ? "All tasks completed!"
                : "No completed tasks yet"}
            </h3>
            <p className="text-gray-500">
              {filter === "active"
                ? "Great job! You've completed all your tasks."
                : "Complete some tasks to see them here."}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!taskToDelete}
        onClose={handleCancelDelete}
        onConfirm={handleConfirmDelete}
        title="Delete Task"
        message={
          taskToDelete ? (
            <p>
              Are you sure you want to delete{" "}
              <span className="font-semibold">&quot;{taskToDelete.title}&quot;</span>?
              This action cannot be undone.
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

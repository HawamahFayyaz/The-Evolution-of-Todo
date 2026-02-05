/**
 * React hook for task management.
 *
 * Provides state and actions for CRUD operations on tasks.
 * Includes toast notifications for success/error feedback.
 */

"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import type { CreateTaskData, Task, UpdateTaskData } from "@/types";
import {
  createTask as apiCreateTask,
  deleteTask as apiDeleteTask,
  listTasks as apiListTasks,
  searchTasks as apiSearchTasks,
  toggleTaskCompletion as apiToggleTask,
  updateTask as apiUpdateTask,
} from "@/lib/api/tasks";
import { ApiClientError } from "@/lib/api/client";

interface UseTasksState {
  tasks: Task[];
  total: number;
  loading: boolean;
  error: string | null;
}

interface UseTasksActions {
  refresh: () => Promise<void>;
  search: (query: string) => Promise<void>;
  clearSearch: () => Promise<void>;
  createTask: (data: CreateTaskData) => Promise<Task | null>;
  updateTask: (taskId: number, data: UpdateTaskData) => Promise<Task | null>;
  deleteTask: (taskId: number) => Promise<boolean>;
  toggleTask: (taskId: number) => Promise<Task | null>;
}

type UseTasksReturn = UseTasksState & UseTasksActions;

/**
 * Hook for managing task state and operations.
 *
 * @param completedFilter - Optional filter by completion status
 * @returns Task state and CRUD actions
 *
 * @example
 * ```tsx
 * const { tasks, loading, createTask, toggleTask } = useTasks();
 *
 * // Create a new task
 * await createTask({ title: "New task" });
 *
 * // Toggle completion
 * await toggleTask(task.id);
 * ```
 */
export function useTasks(completedFilter?: boolean): UseTasksReturn {
  const [state, setState] = useState<UseTasksState>({
    tasks: [],
    total: 0,
    loading: true,
    error: null,
  });

  const refresh = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const response = await apiListTasks(completedFilter);
      setState({
        tasks: response.tasks,
        total: response.total,
        loading: false,
        error: null,
      });
    } catch (err) {
      const message =
        err instanceof ApiClientError
          ? err.message
          : "Failed to load tasks";
      setState((prev) => ({
        ...prev,
        loading: false,
        error: message,
      }));
    }
  }, [completedFilter]);

  // Load tasks on mount and when filter changes
  useEffect(() => {
    const loadTasks = async () => {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      try {
        const response = await apiListTasks(completedFilter);
        setState({
          tasks: response.tasks,
          total: response.total,
          loading: false,
          error: null,
        });
      } catch (err) {
        const message =
          err instanceof ApiClientError
            ? err.message
            : "Failed to load tasks";
        setState((prev) => ({
          ...prev,
          loading: false,
          error: message,
        }));
      }
    };
    loadTasks();
  }, [completedFilter]);

  const search = useCallback(
    async (query: string) => {
      if (!query.trim()) {
        await refresh();
        return;
      }

      setState((prev) => ({ ...prev, loading: true, error: null }));

      try {
        const response = await apiSearchTasks(query, completedFilter);
        setState({
          tasks: response.tasks,
          total: response.total,
          loading: false,
          error: null,
        });
      } catch (err) {
        const message =
          err instanceof ApiClientError
            ? err.message
            : "Failed to search tasks";
        setState((prev) => ({
          ...prev,
          loading: false,
          error: message,
        }));
      }
    },
    [completedFilter, refresh]
  );

  const clearSearch = useCallback(async () => {
    await refresh();
  }, [refresh]);

  const createTask = useCallback(
    async (data: CreateTaskData): Promise<Task | null> => {
      try {
        const task = await apiCreateTask(data);
        setState((prev) => ({
          ...prev,
          tasks: [task, ...prev.tasks],
          total: prev.total + 1,
        }));
        toast.success("Task created successfully");
        return task;
      } catch (err) {
        const message =
          err instanceof ApiClientError
            ? err.message
            : "Failed to create task";
        setState((prev) => ({ ...prev, error: message }));
        toast.error(message);
        return null;
      }
    },
    []
  );

  const updateTask = useCallback(
    async (taskId: number, data: UpdateTaskData): Promise<Task | null> => {
      try {
        const updatedTask = await apiUpdateTask(taskId, data);
        setState((prev) => ({
          ...prev,
          tasks: prev.tasks.map((t) =>
            t.id === taskId ? updatedTask : t
          ),
        }));
        toast.success("Task updated successfully");
        return updatedTask;
      } catch (err) {
        const message =
          err instanceof ApiClientError
            ? err.message
            : "Failed to update task";
        setState((prev) => ({ ...prev, error: message }));
        toast.error(message);
        return null;
      }
    },
    []
  );

  const deleteTask = useCallback(
    async (taskId: number): Promise<boolean> => {
      try {
        await apiDeleteTask(taskId);
        setState((prev) => ({
          ...prev,
          tasks: prev.tasks.filter((t) => t.id !== taskId),
          total: prev.total - 1,
        }));
        toast.success("Task deleted successfully");
        return true;
      } catch (err) {
        const message =
          err instanceof ApiClientError
            ? err.message
            : "Failed to delete task";
        setState((prev) => ({ ...prev, error: message }));
        toast.error(message);
        return false;
      }
    },
    []
  );

  const toggleTask = useCallback(
    async (taskId: number): Promise<Task | null> => {
      try {
        const updatedTask = await apiToggleTask(taskId);
        setState((prev) => ({
          ...prev,
          tasks: prev.tasks.map((t) =>
            t.id === taskId ? updatedTask : t
          ),
        }));
        // Show appropriate toast based on completion status
        if (updatedTask.completed) {
          toast.success("Task marked as completed");
        } else {
          toast.info("Task marked as incomplete");
        }
        return updatedTask;
      } catch (err) {
        const message =
          err instanceof ApiClientError
            ? err.message
            : "Failed to toggle task";
        setState((prev) => ({ ...prev, error: message }));
        toast.error(message);
        return null;
      }
    },
    []
  );

  return {
    ...state,
    refresh,
    search,
    clearSearch,
    createTask,
    updateTask,
    deleteTask,
    toggleTask,
  };
}

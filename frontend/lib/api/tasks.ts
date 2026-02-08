/**
 * Task API client functions.
 *
 * Provides type-safe functions for task CRUD operations.
 */

import type { CreateTaskData, Task, TaskPriority, RecurrencePattern, UpdateTaskData } from "@/types";
import { apiClient } from "./client";

/** Backend API response (snake_case) */
interface ApiTask {
  id: number;
  user_id: string;
  title: string;
  description: string;
  completed: boolean;
  priority: TaskPriority;
  due_date: string | null;
  tags: string[];
  recurrence_pattern: RecurrencePattern;
  created_at: string;
  updated_at: string;
}

interface ApiTaskListResponse {
  tasks: ApiTask[];
  total: number;
}

interface TaskListResponse {
  tasks: Task[];
  total: number;
}

/** Transform snake_case to camelCase */
function toTask(apiTask: ApiTask): Task {
  return {
    id: apiTask.id,
    userId: apiTask.user_id,
    title: apiTask.title,
    description: apiTask.description,
    completed: apiTask.completed,
    priority: apiTask.priority,
    dueDate: apiTask.due_date,
    tags: apiTask.tags ?? [],
    recurrencePattern: apiTask.recurrence_pattern ?? "none",
    createdAt: apiTask.created_at,
    updatedAt: apiTask.updated_at,
  };
}

/**
 * List all tasks for the current user.
 *
 * @param completed - Optional filter by completion status
 * @returns List of tasks and total count
 */
export async function listTasks(completed?: boolean): Promise<TaskListResponse> {
  const params = completed !== undefined ? `?completed=${completed}` : "";
  const response = await apiClient<ApiTaskListResponse>(`/api/tasks${params}`);
  return {
    tasks: response.tasks.map(toTask),
    total: response.total,
  };
}

/**
 * Get a specific task by ID.
 *
 * @param taskId - Task ID to retrieve
 * @returns The requested task
 * @throws ApiClientError if task not found (404)
 */
export async function getTask(taskId: number): Promise<Task> {
  const response = await apiClient<ApiTask>(`/api/tasks/${taskId}`);
  return toTask(response);
}

/**
 * Create a new task.
 *
 * @param data - Task creation data (title, description)
 * @returns The created task
 */
export async function createTask(data: CreateTaskData): Promise<Task> {
  const response = await apiClient<ApiTask>("/api/tasks", {
    method: "POST",
    body: JSON.stringify(data),
  });
  return toTask(response);
}

/**
 * Update an existing task.
 *
 * @param taskId - Task ID to update
 * @param data - Fields to update (all optional)
 * @returns The updated task
 * @throws ApiClientError if task not found (404)
 */
export async function updateTask(
  taskId: number,
  data: UpdateTaskData
): Promise<Task> {
  const response = await apiClient<ApiTask>(`/api/tasks/${taskId}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
  return toTask(response);
}

/**
 * Delete a task (soft delete).
 *
 * @param taskId - Task ID to delete
 * @throws ApiClientError if task not found (404)
 */
export async function deleteTask(taskId: number): Promise<void> {
  await apiClient<void>(`/api/tasks/${taskId}`, {
    method: "DELETE",
  });
}

/**
 * Toggle task completion status.
 *
 * @param taskId - Task ID to toggle
 * @returns The updated task
 * @throws ApiClientError if task not found (404)
 */
export async function toggleTaskCompletion(taskId: number): Promise<Task> {
  const response = await apiClient<ApiTask>(`/api/tasks/${taskId}/complete`, {
    method: "PATCH",
  });
  return toTask(response);
}

/**
 * Search tasks by title or description.
 *
 * @param query - Search query string
 * @param completed - Optional filter by completion status
 * @returns Matching tasks and total count
 */
export async function searchTasks(
  query: string,
  completed?: boolean
): Promise<TaskListResponse> {
  const params = new URLSearchParams({ q: query });
  if (completed !== undefined) {
    params.set("completed", String(completed));
  }
  const response = await apiClient<ApiTaskListResponse>(
    `/api/tasks/search?${params.toString()}`
  );
  return {
    tasks: response.tasks.map(toTask),
    total: response.total,
  };
}

/**
 * TypeScript type definitions for the todo application.
 */

/**
 * Task entity representing a user's to-do item.
 * Matches backend TaskResponse schema.
 */
export interface Task {
  id: number;
  userId: string;
  title: string;
  description: string;
  completed: boolean;
  createdAt: string; // ISO 8601 datetime
  updatedAt: string; // ISO 8601 datetime
}

/**
 * Data for creating a new task.
 * user_id is NOT included - it comes from JWT token on backend.
 */
export interface CreateTaskData {
  title: string;
  description?: string;
}

/**
 * Data for updating an existing task.
 * All fields are optional.
 */
export interface UpdateTaskData {
  title?: string;
  description?: string;
}

/**
 * Task filter options for list endpoint.
 */
export interface TaskFilters {
  status?: "all" | "pending" | "completed";
  sort?: "created" | "title";
}

/**
 * User session from Better Auth.
 */
export interface User {
  id: string;
  email: string;
  name?: string;
}

/**
 * API error response structure.
 */
export interface ApiError {
  code: string;
  message: string;
  field?: string;
}

/**
 * Structured API error response.
 */
export interface ApiErrorResponse {
  detail: ApiError | string;
}

/**
 * Transform snake_case API response to camelCase.
 * Used for Task responses from the backend.
 */
export function transformTask(apiTask: {
  id: number;
  user_id: string;
  title: string;
  description: string;
  completed: boolean;
  created_at: string;
  updated_at: string;
}): Task {
  return {
    id: apiTask.id,
    userId: apiTask.user_id,
    title: apiTask.title,
    description: apiTask.description,
    completed: apiTask.completed,
    createdAt: apiTask.created_at,
    updatedAt: apiTask.updated_at,
  };
}

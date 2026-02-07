/**
 * Base API client with fetch wrapper and authentication.
 */

import type { ApiErrorResponse } from "@/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

/**
 * Custom error class for API errors.
 */
export class ApiClientError extends Error {
  status: number;
  code: string;

  constructor(status: number, message: string, code: string = "UNKNOWN_ERROR") {
    super(message);
    this.name = "ApiClientError";
    this.status = status;
    this.code = code;
  }
}

/**
 * Get authentication token from Better Auth session.
 * Returns null if not authenticated.
 */
async function getAuthToken(): Promise<string | null> {
  // Import dynamically to avoid server/client issues
  if (typeof window === "undefined") {
    return null; // Server-side, use session from headers
  }

  try {
    const { getSessionToken } = await import("@/lib/auth-client");
    return await getSessionToken();
  } catch {
    return null;
  }
}

/**
 * Type-safe API client for making requests to the backend.
 *
 * @param endpoint - API endpoint path (e.g., "/api/tasks")
 * @param options - Fetch options (method, body, headers)
 * @returns Parsed JSON response
 * @throws ApiClientError on non-2xx responses
 *
 * @example
 * // GET request
 * const tasks = await apiClient<Task[]>("/api/tasks");
 *
 * @example
 * // POST request
 * const task = await apiClient<Task>("/api/tasks", {
 *   method: "POST",
 *   body: JSON.stringify({ title: "New task" }),
 * });
 */
export async function apiClient<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = await getAuthToken();

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  if (token) {
    (headers as Record<string, string>)["Authorization"] = `Bearer ${token}`;
  }

  let response: Response;
  try {
    response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
      credentials: "include", // Include cookies for Better Auth
    });
  } catch (err) {
    throw new ApiClientError(
      0,
      "Unable to reach the server. Please check your connection and try again.",
      "NETWORK_ERROR"
    );
  }

  if (!response.ok) {
    let errorMessage = "An error occurred";
    let errorCode = "UNKNOWN_ERROR";

    try {
      const errorData: ApiErrorResponse = await response.json();
      if (typeof errorData.detail === "string") {
        errorMessage = errorData.detail;
      } else if (errorData.detail) {
        errorMessage = errorData.detail.message;
        errorCode = errorData.detail.code;
      }
    } catch {
      // If JSON parsing fails, use status text
      errorMessage = response.statusText || errorMessage;
    }

    throw new ApiClientError(response.status, errorMessage, errorCode);
  }

  // Handle 204 No Content
  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
}

/**
 * API client with automatic token injection from Better Auth session.
 * Use this in client components after Better Auth is configured.
 */
export async function apiClientWithAuth<T>(
  endpoint: string,
  token: string,
  options: RequestInit = {}
): Promise<T> {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${token}`,
    ...options.headers,
  };

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorMessage = "An error occurred";
    let errorCode = "UNKNOWN_ERROR";

    try {
      const errorData: ApiErrorResponse = await response.json();
      if (typeof errorData.detail === "string") {
        errorMessage = errorData.detail;
      } else if (errorData.detail) {
        errorMessage = errorData.detail.message;
        errorCode = errorData.detail.code;
      }
    } catch {
      errorMessage = response.statusText || errorMessage;
    }

    throw new ApiClientError(response.status, errorMessage, errorCode);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
}

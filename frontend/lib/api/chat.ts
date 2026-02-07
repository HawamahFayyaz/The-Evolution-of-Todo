/**
 * Chat API client for communicating with the chat backend.
 */

import { apiClient, ApiClientError } from "./client";
import type {
  ChatApiRequest,
  ChatApiResponse,
  ChatMessage,
  ChatError,
} from "@/types/chat";

/**
 * Send a message to the chat API.
 *
 * @param request - The chat request with message and optional conversation_id
 * @returns The chat response with AI message and tool calls
 * @throws ApiClientError on API errors
 *
 * @example
 * const response = await sendMessage({ message: "Add a task: buy groceries" });
 * console.log(response.response); // "I've added 'buy groceries' to your tasks"
 */
export async function sendMessage(
  request: ChatApiRequest
): Promise<ChatApiResponse> {
  return apiClient<ChatApiResponse>("/api/chat", {
    method: "POST",
    body: JSON.stringify(request),
  });
}

/**
 * Get conversation history for a specific conversation.
 *
 * @param conversationId - The UUID of the conversation
 * @param limit - Maximum number of messages to fetch (default: 50)
 * @returns Array of chat messages in chronological order
 * @throws ApiClientError on API errors
 *
 * @example
 * const messages = await getConversationHistory("uuid-here");
 * messages.forEach(msg => console.log(`${msg.role}: ${msg.content}`));
 */
export async function getConversationHistory(
  conversationId: string,
  limit: number = 50
): Promise<ChatMessage[]> {
  const url = `/api/conversations/${conversationId}/messages?limit=${limit}`;
  const response = await apiClient<ChatMessage[]>(url);

  // Transform snake_case to camelCase
  return response.map((msg) => ({
    ...msg,
    toolCalls: (msg as unknown as { tool_calls?: ChatMessage["toolCalls"] })
      .tool_calls,
    createdAt:
      msg.createdAt ||
      (msg as unknown as { created_at?: string }).created_at ||
      "",
  }));
}

/**
 * Convert API error to ChatError for UI display.
 *
 * @param error - The caught error from API call
 * @returns ChatError with user-friendly message and retry info
 */
export function apiErrorToChatError(error: unknown): ChatError {
  if (error instanceof ApiClientError) {
    switch (error.status) {
      case 401:
        return {
          type: "auth",
          message: "Your session has expired. Please log in again.",
          retryable: false,
          originalError: error,
        };
      case 404:
        return {
          type: "not_found",
          message: "This conversation could not be found. Starting a new one.",
          retryable: false,
          originalError: error,
        };
      case 422:
        return {
          type: "validation",
          message: error.message || "Please check your message and try again.",
          retryable: false,
          originalError: error,
        };
      case 429:
        return {
          type: "server",
          message: "Please wait a moment before sending another message.",
          retryable: true,
          originalError: error,
        };
      case 500:
      case 502:
      case 503:
      case 504:
        return {
          type: "server",
          message: "Something went wrong on our end. Please try again.",
          retryable: true,
          originalError: error,
        };
      default:
        return {
          type: "server",
          message: error.message || "An unexpected error occurred.",
          retryable: true,
          originalError: error,
        };
    }
  }

  // Network errors or other unknown errors
  if (error instanceof Error && error.message.includes("fetch")) {
    return {
      type: "network",
      message: "Unable to connect. Please check your internet connection.",
      retryable: true,
      originalError: error,
    };
  }

  return {
    type: "server",
    message: "An unexpected error occurred. Please try again.",
    retryable: true,
    originalError: error,
  };
}

/**
 * Mock sendMessage for development when backend is not ready.
 * Uncomment this and comment out the real sendMessage above to use.
 */
// export async function sendMessage(
//   request: ChatApiRequest
// ): Promise<ChatApiResponse> {
//   // Simulate network delay
//   await new Promise((resolve) => setTimeout(resolve, 1500));

//   // Return mock response
//   const hasTaskKeyword = request.message.toLowerCase().includes("add");

//   return {
//     conversation_id: request.conversation_id || crypto.randomUUID(),
//     response: hasTaskKeyword
//       ? `I've added that task to your list. Is there anything else you'd like me to help with?`
//       : `I received your message: "${request.message}". How can I help you manage your tasks?`,
//     tool_calls: hasTaskKeyword
//       ? [
//           {
//             tool: "add_task",
//             args: { title: request.message.replace(/add\s*/i, "").trim() },
//             result: { success: true, task_id: crypto.randomUUID() },
//           },
//         ]
//       : undefined,
//   };
// }

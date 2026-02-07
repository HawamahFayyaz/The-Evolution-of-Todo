# Data Model: Chat UI Interface

**Feature**: 005-chat-ui
**Date**: 2026-02-05
**Status**: Complete

## Overview

This document defines the TypeScript types and data structures used in the Chat UI frontend. These types align with the Chat API (004-chat-api) response schemas and enable type-safe development.

---

## 1. Core Types

### 1.1 ChatMessage

Represents a single message in the conversation.

```typescript
/**
 * Individual message in a chat conversation.
 * Maps to backend Message model with camelCase conversion.
 */
export interface ChatMessage {
  /** Unique identifier (UUID) */
  id: string;

  /** Message sender role */
  role: 'user' | 'assistant';

  /** Text content of the message */
  content: string;

  /** Tool calls made during this message (assistant only) */
  toolCalls?: ToolCall[];

  /** ISO timestamp when message was created */
  createdAt: string;
}
```

### 1.2 ToolCall

Represents an AI tool execution.

```typescript
/**
 * Tool call made by the AI assistant.
 * Displayed as badges in the UI.
 */
export interface ToolCall {
  /** Tool identifier (e.g., "add_task", "list_tasks") */
  tool: string;

  /** Arguments passed to the tool */
  args: Record<string, unknown>;

  /** Result returned by the tool */
  result: Record<string, unknown>;
}
```

### 1.3 Conversation

Represents a chat session (for future sidebar feature).

```typescript
/**
 * Chat conversation session.
 * Currently only ID is needed; full model for future features.
 */
export interface Conversation {
  /** Unique identifier (UUID) */
  id: string;

  /** ISO timestamp when conversation started */
  createdAt: string;

  /** ISO timestamp of last activity */
  updatedAt: string;
}
```

---

## 2. API Types

### 2.1 Request Types

```typescript
/**
 * Request body for POST /api/chat
 */
export interface ChatApiRequest {
  /** Existing conversation ID (optional, creates new if omitted) */
  conversation_id?: string;

  /** User's message text (required, max 2000 chars) */
  message: string;
}

/**
 * Request params for GET /api/conversations/{id}/messages
 */
export interface GetMessagesRequest {
  /** Conversation ID to fetch messages for */
  conversationId: string;

  /** Maximum number of messages to return (default: 50) */
  limit?: number;
}
```

### 2.2 Response Types

```typescript
/**
 * Response body from POST /api/chat
 */
export interface ChatApiResponse {
  /** Conversation ID (new or existing) */
  conversation_id: string;

  /** AI assistant's response text */
  response: string;

  /** Tool calls made during processing (optional) */
  tool_calls?: ToolCall[];
}

/**
 * Response body from GET /api/conversations/{id}/messages
 */
export type GetMessagesResponse = ChatMessage[];
```

---

## 3. UI State Types

### 3.1 ChatError

```typescript
/**
 * Error state for chat operations.
 * Used to display appropriate error UI.
 */
export interface ChatError {
  /** Error category for UI handling */
  type: 'auth' | 'validation' | 'not_found' | 'server' | 'network';

  /** User-friendly error message */
  message: string;

  /** Whether the operation can be retried */
  retryable: boolean;

  /** Original error for logging (optional) */
  originalError?: unknown;
}
```

### 3.2 ChatState

```typescript
/**
 * Complete chat UI state.
 * Managed by ChatContainer component.
 */
export interface ChatState {
  /** Current conversation ID (null for new conversations) */
  conversationId: string | null;

  /** All messages in the conversation */
  messages: ChatMessage[];

  /** Whether AI is processing a response */
  isLoading: boolean;

  /** Current error state (null if no error) */
  error: ChatError | null;

  /** Current input field value */
  inputValue: string;

  /** Whether initial history is loading */
  isLoadingHistory: boolean;
}
```

### 3.3 ChatInputState

```typescript
/**
 * Input field state for character limit tracking.
 */
export interface ChatInputState {
  /** Current input value */
  value: string;

  /** Character count */
  charCount: number;

  /** Maximum allowed characters */
  maxChars: number;

  /** Whether input is valid for sending */
  isValid: boolean;
}
```

---

## 4. Component Props Types

### 4.1 ChatMessageProps

```typescript
export interface ChatMessageProps {
  /** The message to display */
  message: ChatMessage;

  /** Whether this is the most recent message (for animations) */
  isLatest?: boolean;
}
```

### 4.2 ChatInputProps

```typescript
export interface ChatInputProps {
  /** Current input value */
  value: string;

  /** Value change handler */
  onChange: (value: string) => void;

  /** Send message handler */
  onSend: () => void;

  /** Whether input is disabled (during loading) */
  disabled?: boolean;

  /** Maximum character limit */
  maxLength?: number;

  /** Placeholder text */
  placeholder?: string;
}
```

### 4.3 ChatErrorProps

```typescript
export interface ChatErrorProps {
  /** The error to display */
  error: ChatError;

  /** Retry button handler */
  onRetry?: () => void;

  /** Fallback link handler */
  onFallback?: () => void;
}
```

### 4.4 ToolCallBadgeProps

```typescript
export interface ToolCallBadgeProps {
  /** The tool call to display */
  toolCall: ToolCall;
}
```

---

## 5. Constants

### 5.1 Message Limits

```typescript
export const CHAT_CONSTANTS = {
  /** Maximum message length in characters */
  MAX_MESSAGE_LENGTH: 2000,

  /** Character count to start showing warning */
  CHAR_WARNING_THRESHOLD: 1800,

  /** Maximum messages to load from history */
  MAX_HISTORY_MESSAGES: 50,

  /** Textarea minimum height in pixels */
  INPUT_MIN_HEIGHT: 44,

  /** Textarea maximum height in pixels (~5 lines) */
  INPUT_MAX_HEIGHT: 120,
} as const;
```

### 5.2 Tool Display Names

```typescript
/**
 * Human-readable names for MCP tools.
 * Maps tool identifiers to display text.
 */
export const TOOL_DISPLAY_NAMES: Record<string, string> = {
  add_task: 'Added task',
  list_tasks: 'Listed tasks',
  complete_task: 'Completed task',
  delete_task: 'Deleted task',
  update_task: 'Updated task',
} as const;
```

### 5.3 Error Messages

```typescript
/**
 * User-friendly error messages by type.
 */
export const ERROR_MESSAGES: Record<ChatError['type'], string> = {
  auth: 'Your session has expired. Please log in again.',
  validation: 'Please check your message and try again.',
  not_found: 'This conversation could not be found. Starting a new one.',
  server: 'Something went wrong on our end. Please try again.',
  network: 'Unable to connect. Please check your internet connection.',
} as const;
```

---

## 6. Type Guards

```typescript
/**
 * Check if a message has tool calls.
 */
export function hasToolCalls(message: ChatMessage): boolean {
  return message.role === 'assistant' &&
         Array.isArray(message.toolCalls) &&
         message.toolCalls.length > 0;
}

/**
 * Check if an error is retryable.
 */
export function isRetryableError(error: ChatError): boolean {
  return error.retryable &&
         (error.type === 'server' || error.type === 'network');
}

/**
 * Check if input is valid for sending.
 */
export function isValidInput(value: string, maxLength: number): boolean {
  const trimmed = value.trim();
  return trimmed.length > 0 && trimmed.length <= maxLength;
}
```

---

## 7. API Response Transformation

```typescript
/**
 * Transform API response to UI message format.
 * Handles snake_case to camelCase conversion.
 */
export function transformApiResponse(response: ChatApiResponse): ChatMessage {
  return {
    id: crypto.randomUUID(), // Client-generated until backend returns it
    role: 'assistant',
    content: response.response,
    toolCalls: response.tool_calls?.map(tc => ({
      tool: tc.tool,
      args: tc.args,
      result: tc.result,
    })),
    createdAt: new Date().toISOString(),
  };
}

/**
 * Create a user message from input.
 */
export function createUserMessage(content: string): ChatMessage {
  return {
    id: crypto.randomUUID(),
    role: 'user',
    content: content.trim(),
    createdAt: new Date().toISOString(),
  };
}
```

---

## 8. Type Exports

All types should be exported from `frontend/types/chat.ts`:

```typescript
// Core types
export type { ChatMessage, ToolCall, Conversation };

// API types
export type { ChatApiRequest, ChatApiResponse, GetMessagesRequest, GetMessagesResponse };

// UI types
export type { ChatError, ChatState, ChatInputState };

// Props types
export type { ChatMessageProps, ChatInputProps, ChatErrorProps, ToolCallBadgeProps };

// Constants
export { CHAT_CONSTANTS, TOOL_DISPLAY_NAMES, ERROR_MESSAGES };

// Type guards and transformers
export { hasToolCalls, isRetryableError, isValidInput, transformApiResponse, createUserMessage };
```

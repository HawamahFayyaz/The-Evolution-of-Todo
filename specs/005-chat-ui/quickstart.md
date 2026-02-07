# Quickstart: Chat UI Interface

**Feature**: 005-chat-ui
**Date**: 2026-02-05
**Status**: Ready for implementation

## Prerequisites

Before implementing the Chat UI, ensure:

1. **Phase II frontend is running**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

2. **Authentication works** (Better Auth configured)

3. **Chat API spec is defined** (004-chat-api)

---

## File Creation Order

Create files in this order to satisfy dependencies:

### Step 1: Types (no dependencies)
```
frontend/types/chat.ts
```

### Step 2: API Client (depends on types)
```
frontend/lib/api/chat.ts
```

### Step 3: Presentational Components (depends on types)
```
frontend/components/chat/chat-loading.tsx
frontend/components/chat/chat-empty-state.tsx
frontend/components/chat/tool-call-badge.tsx
frontend/components/chat/chat-message.tsx
frontend/components/chat/chat-error.tsx
frontend/components/chat/chat-input.tsx
```

### Step 4: Container Component (depends on all above)
```
frontend/components/chat/chat-container.tsx
```

### Step 5: Barrel Export
```
frontend/components/chat/index.ts
```

### Step 6: Page (depends on container)
```
frontend/app/dashboard/chat/page.tsx
```

### Step 7: Navigation Update
```
frontend/app/dashboard/dashboard-nav.tsx  # Add chat link
```

---

## Quick Implementation Snippets

### types/chat.ts

```typescript
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  toolCalls?: ToolCall[];
  createdAt: string;
}

export interface ToolCall {
  tool: string;
  args: Record<string, unknown>;
  result: Record<string, unknown>;
}

export interface ChatError {
  type: 'auth' | 'validation' | 'not_found' | 'server' | 'network';
  message: string;
  retryable: boolean;
}

export interface ChatApiRequest {
  conversation_id?: string;
  message: string;
}

export interface ChatApiResponse {
  conversation_id: string;
  response: string;
  tool_calls?: ToolCall[];
}

export const CHAT_CONSTANTS = {
  MAX_MESSAGE_LENGTH: 2000,
  CHAR_WARNING_THRESHOLD: 1800,
} as const;

export const TOOL_DISPLAY_NAMES: Record<string, string> = {
  add_task: 'Added task',
  list_tasks: 'Listed tasks',
  complete_task: 'Completed task',
  delete_task: 'Deleted task',
  update_task: 'Updated task',
};
```

### lib/api/chat.ts

```typescript
import { apiClient } from './client';
import type { ChatApiRequest, ChatApiResponse, ChatMessage } from '@/types/chat';

export async function sendMessage(request: ChatApiRequest): Promise<ChatApiResponse> {
  return apiClient<ChatApiResponse>('/chat', {
    method: 'POST',
    body: JSON.stringify(request),
  });
}

export async function getConversationHistory(
  conversationId: string
): Promise<ChatMessage[]> {
  return apiClient<ChatMessage[]>(`/conversations/${conversationId}/messages`);
}
```

### components/chat/chat-message.tsx

```typescript
"use client";

import type { ChatMessage, ToolCall } from "@/types/chat";
import { ToolCallBadge } from "./tool-call-badge";

interface ChatMessageProps {
  message: ChatMessage;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} mb-4`}>
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-2 ${
          isUser
            ? "bg-indigo-600 text-white rounded-br-md"
            : "bg-gray-100 text-gray-900 rounded-bl-md"
        }`}
      >
        <p className="whitespace-pre-wrap">{message.content}</p>
        {message.toolCalls && message.toolCalls.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {message.toolCalls.map((tc, i) => (
              <ToolCallBadge key={i} toolCall={tc} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
```

### components/chat/chat-input.tsx

```typescript
"use client";

import { KeyboardEvent, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { CHAT_CONSTANTS } from "@/types/chat";

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  disabled?: boolean;
}

export function ChatInput({ value, onChange, onSend, disabled }: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const charCount = value.length;
  const isNearLimit = charCount >= CHAT_CONSTANTS.CHAR_WARNING_THRESHOLD;

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (value.trim() && !disabled) {
        onSend();
      }
    }
  };

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = Math.min(textarea.scrollHeight, 120) + "px";
    }
  }, [value]);

  return (
    <div className="border-t border-gray-200 bg-white p-4">
      <div className="flex gap-2 items-end">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder="Type your message..."
          maxLength={CHAT_CONSTANTS.MAX_MESSAGE_LENGTH}
          className="flex-1 resize-none rounded-lg border border-gray-300 px-3 py-2
            focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500
            disabled:bg-gray-100 disabled:cursor-not-allowed
            min-h-[44px] max-h-[120px]"
          rows={1}
        />
        <Button
          onClick={onSend}
          disabled={disabled || !value.trim()}
          isLoading={disabled}
          variant="primary"
        >
          Send
        </Button>
      </div>
      {isNearLimit && (
        <p className="text-xs text-gray-500 mt-1 text-right">
          {charCount}/{CHAT_CONSTANTS.MAX_MESSAGE_LENGTH}
        </p>
      )}
    </div>
  );
}
```

### app/dashboard/chat/page.tsx

```typescript
import { ChatContainer } from "@/components/chat";

export default function ChatPage() {
  return (
    <div className="h-[calc(100vh-5rem)]">
      <ChatContainer />
    </div>
  );
}
```

---

## Testing the Implementation

### 1. Visual Check

1. Navigate to `/dashboard/chat`
2. Verify empty state shows welcome message
3. Type a message and press Enter
4. Verify loading indicator appears
5. Verify AI response displays (mock if API not ready)

### 2. Keyboard Navigation

- [ ] Enter sends message
- [ ] Shift+Enter adds new line
- [ ] Tab moves to Send button
- [ ] Input disabled during loading

### 3. Responsive Check

1. Open browser DevTools
2. Toggle device toolbar
3. Test at 320px, 375px, 768px, 1024px widths
4. Verify input stays at bottom on mobile

---

## Mock API for Development

If Chat API (004-chat-api) is not ready, use this mock:

```typescript
// lib/api/chat.ts (temporary mock)

export async function sendMessage(request: ChatApiRequest): Promise<ChatApiResponse> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1500));

  // Return mock response
  return {
    conversation_id: request.conversation_id || crypto.randomUUID(),
    response: `I received your message: "${request.message}". This is a mock response.`,
    tool_calls: request.message.toLowerCase().includes('add')
      ? [{ tool: 'add_task', args: { title: 'Mock task' }, result: { success: true } }]
      : undefined,
  };
}
```

---

## Common Issues

### Issue: Messages not scrolling

**Solution**: Add scroll behavior to message container:
```typescript
const scrollToBottom = () => {
  messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
};
```

### Issue: Textarea not growing

**Solution**: Ensure `resize-none` and JS height adjustment are both applied.

### Issue: 401 errors

**Solution**: Check that `apiClient` includes Authorization header from auth context.

---

## Next Steps After Implementation

1. Run `/sp.tasks` to generate detailed task breakdown
2. Create feature branch: `git checkout -b 005-chat-ui`
3. Implement in order specified above
4. Write tests alongside components
5. Request code review before merge

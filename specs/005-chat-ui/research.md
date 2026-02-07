# Research: Chat UI Interface

**Feature**: 005-chat-ui
**Date**: 2026-02-05
**Status**: Complete

## Objective

Research existing patterns, libraries, and design considerations for implementing a chat interface that integrates with the DoNext design system and Chat API backend.

---

## 1. Existing Codebase Analysis

### 1.1 UI Components Available

| Component | Location | Reusability |
|-----------|----------|-------------|
| Button | `frontend/components/ui/button.tsx` | ✅ Use for Send button (primary variant, loading state) |
| Input | `frontend/components/ui/input.tsx` | ⚠️ Adapt - need textarea, not input |
| Card | `frontend/components/ui/card.tsx` | ✅ Use for message bubbles |
| ConfirmDialog | `frontend/components/ui/confirm-dialog.tsx` | ✅ Use for "New Conversation" confirmation |
| Logo | `frontend/components/ui/logo.tsx` | ✅ Use in empty state |

### 1.2 Design System Tokens

From `frontend/CLAUDE.md` and existing components:

```css
/* Colors - Indigo Dream */
--primary: bg-indigo-600 / text-indigo-600
--primary-hover: hover:bg-indigo-700
--success: bg-emerald-500
--warning: bg-amber-500
--danger: bg-red-500
--surface: bg-gray-50
--border: border-gray-200

/* Spacing */
--spacing-sm: 0.5rem (8px)
--spacing-md: 1rem (16px)
--spacing-lg: 1.5rem (24px)

/* Radius */
--radius-lg: rounded-lg (0.5rem)
--radius-xl: rounded-xl (0.75rem)
```

### 1.3 Layout Patterns

From `frontend/app/dashboard/layout.tsx`:
- Protected route pattern with auth check
- `min-h-screen bg-gray-50` for page background
- `container mx-auto px-4 py-8` for content area

### 1.4 API Client Pattern

From `frontend/lib/api/client.ts`:
- Generic `apiClient<T>()` function with JWT injection
- Error handling with `ApiError` class
- Base URL from `NEXT_PUBLIC_API_URL`

---

## 2. Chat UI Patterns Research

### 2.1 Message Alignment

**Industry standard** (WhatsApp, iMessage, Slack):
- User messages: Right-aligned with colored background
- AI/Other messages: Left-aligned with neutral background

**Recommendation**: Follow standard pattern
- User: Right-aligned, indigo background (`bg-indigo-600 text-white`)
- AI: Left-aligned, gray background (`bg-gray-100 text-gray-900`)

### 2.2 Message Bubble Design

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│                              ┌───────────────────┐              │
│                              │ User message      │              │
│                              │ with indigo bg    │──────────────│
│                              └───────────────────┘              │
│   ┌───────────────────────────────┐                             │
│   │ AI response with gray bg      │                             │
│───│ Can be longer and wrap        │                             │
│   │ to multiple lines             │                             │
│   └───────────────────────────────┘                             │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │ ✓ Added task  ✓ Listed tasks                            │   │
│   └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 2.3 Input Area Design

**Requirements from spec**:
- Text input area (FR-006)
- Send button (FR-007)
- Enter to send (FR-008)
- Shift+Enter for newline (FR-009)
- Growing textarea (FR-010)
- Character limit feedback (FR-011)

**Implementation approach**:
```
┌─────────────────────────────────────────────────────────────────┐
│ ┌─────────────────────────────────────────────────────────┐ ┌─┐ │
│ │ Type your message...                                    │ │→│ │
│ │                                                         │ └─┘ │
│ └─────────────────────────────────────────────────────────┘     │
│                                          1847/2000 characters   │
└─────────────────────────────────────────────────────────────────┘
```

### 2.4 Loading States

**Options evaluated**:

| Approach | Pros | Cons |
|----------|------|------|
| Typing dots animation | Familiar, lightweight | Basic |
| Skeleton message | Shows structure | More complex |
| Progress bar | Clear progress | Chat doesn't have progress |
| Spinner | Simple | Less chat-like |

**Recommendation**: Animated typing dots with text "DoNext is thinking..."

### 2.5 Auto-scroll Behavior

**Scenarios**:
1. User at bottom → New message → Scroll to bottom ✓
2. User scrolled up → New message → Show indicator, don't force scroll ✓
3. User sends message → Always scroll to bottom ✓

**Implementation**: Use `useRef` to track scroll position and `scrollIntoView` with smooth behavior.

---

## 3. Third-Party Library Evaluation

### 3.1 OpenAI ChatKit

**Pros**:
- Official OpenAI component library
- Built-in message rendering
- Streaming support

**Cons**:
- Additional dependency
- May conflict with DoNext design system
- Learning curve

**Decision**: DEFER - build custom first, evaluate later

### 3.2 react-textarea-autosize

**Pros**:
- Single responsibility (growing textarea)
- Lightweight (2.5KB)
- Well-maintained

**Cons**:
- Additional dependency

**Decision**: CONSIDER - may use if native CSS solution is complex

### 3.3 CSS-only Growing Textarea

```css
.chat-input {
  min-height: 44px;
  max-height: 120px; /* ~5 lines */
  resize: none;
  overflow-y: auto;
}
```

Combined with JS to adjust height:
```javascript
textarea.style.height = 'auto';
textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
```

**Decision**: Use CSS-only approach first

---

## 4. API Integration Research

### 4.1 Chat API Contract (from 004-chat-api)

**Send Message**:
```
POST /api/chat
Authorization: Bearer <token>
Content-Type: application/json

{
  "conversation_id": "uuid" | null,
  "message": "string"
}

Response 200:
{
  "conversation_id": "uuid",
  "response": "string",
  "tool_calls": [{
    "tool": "add_task",
    "args": { "title": "..." },
    "result": { "task": {...}, "success": true }
  }]
}
```

### 4.2 Conversation History (inferred)

```
GET /api/conversations/{id}/messages
Authorization: Bearer <token>

Response 200:
[
  {
    "id": "uuid",
    "role": "user" | "assistant",
    "content": "string",
    "tool_calls": [...],
    "created_at": "ISO date"
  }
]
```

### 4.3 Error Handling

| Status | Meaning | UI Action |
|--------|---------|-----------|
| 401 | Unauthorized | Redirect to login |
| 404 | Conversation not found | Start new conversation |
| 422 | Validation error | Show inline error |
| 429 | Rate limited | Show "slow down" message |
| 500 | Server error | Show error + fallback link |
| Network | Connection failed | Show offline indicator |

---

## 5. Accessibility Research

### 5.1 Keyboard Navigation

| Key | Action |
|-----|--------|
| Enter | Send message |
| Shift+Enter | New line |
| Tab | Move to send button |
| Escape | Clear input (optional) |

### 5.2 ARIA Attributes

```html
<main role="log" aria-live="polite" aria-label="Chat messages">
  <article role="article" aria-label="User message">...</article>
  <article role="article" aria-label="Assistant response">...</article>
</main>

<form role="form" aria-label="Send message">
  <textarea aria-label="Message input" />
  <button aria-label="Send message" />
</form>
```

### 5.3 Focus Management

- Auto-focus input on page load
- Return focus to input after sending
- Announce new messages to screen readers

---

## 6. Performance Considerations

### 6.1 Message List Optimization

**For <100 messages**: Direct rendering is fine
**For 100+ messages**: Consider virtualization with `react-window` or `@tanstack/virtual`

### 6.2 Image/Media (Out of Scope)

Messages are text-only per spec. No need for lazy loading images.

### 6.3 Debouncing

Character counter updates don't need debouncing (input events are already throttled by browser).

---

## 7. Recommendations Summary

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Message alignment | User right, AI left | Industry standard |
| Color scheme | Indigo user, gray AI | DoNext design system |
| Loading indicator | Typing dots | Familiar, lightweight |
| Textarea growth | CSS + JS | No extra dependency |
| ChatKit | Defer | Build custom first |
| Virtualization | Later if needed | <100 messages expected |
| Error handling | Typed errors + fallback | Per FR-024 to FR-026 |

---

## 8. Open Questions Resolved

1. **Should we use ChatKit?** → No, build custom with DoNext components
2. **How to handle long conversations?** → Virtualize if >100 messages
3. **Mobile keyboard handling?** → Use viewport units, test on devices
4. **Tool call display?** → Compact badges below AI message

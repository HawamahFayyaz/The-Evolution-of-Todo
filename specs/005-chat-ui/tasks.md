# Tasks: Chat UI Interface

**Input**: Design documents from `/specs/005-chat-ui/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Tests are included for critical paths as the spec requires 80%+ coverage.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Web app**: `frontend/` for Next.js components and pages
- Based on plan.md project structure

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Create project structure and type definitions needed by all components

- [x] T001 Create chat types file with all interfaces and constants in frontend/types/chat.ts
- [x] T002 [P] Create chat API client with sendMessage and getConversationHistory in frontend/lib/api/chat.ts
- [x] T003 [P] Create chat components directory with barrel export in frontend/components/chat/index.ts

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Build atomic UI components that are reused across multiple user stories

**⚠️ CRITICAL**: No user story implementation can begin until this phase is complete

- [x] T004 [P] Create ToolCallBadge component with human-readable names in frontend/components/chat/tool-call-badge.tsx
- [x] T005 [P] Create ChatLoading component with typing animation in frontend/components/chat/chat-loading.tsx
- [x] T006 [P] Create ChatError component with retry and fallback in frontend/components/chat/chat-error.tsx
- [x] T007 [P] Create ChatEmptyState component with welcome message in frontend/components/chat/chat-empty-state.tsx

**Checkpoint**: Foundational components ready - user story implementation can now begin

---

## Phase 3: User Story 1 - View and Send Messages (Priority: P1) 🎯 MVP

**Goal**: Users can type messages, send them, and see AI responses in the chat interface

**Independent Test**: Open chat page, type message, click send, verify message appears and AI response displays below it

### Implementation for User Story 1

- [x] T008 [US1] Create ChatMessage component with user/AI variants in frontend/components/chat/chat-message.tsx
- [x] T009 [US1] Create ChatInput component with textarea and send button in frontend/components/chat/chat-input.tsx
- [x] T010 [US1] Create ChatContainer component with state management in frontend/components/chat/chat-container.tsx
- [x] T011 [US1] Create chat page route with Server Component wrapper in frontend/app/dashboard/chat/page.tsx
- [x] T012 [US1] Update barrel export with all chat components in frontend/components/chat/index.ts
- [x] T013 [US1] Implement sendMessage handler with optimistic updates in frontend/components/chat/chat-container.tsx
- [x] T014 [US1] Add error handling for API failures in sendMessage in frontend/components/chat/chat-container.tsx

**Checkpoint**: User Story 1 complete - basic chat send/receive works

---

## Phase 4: User Story 2 - Visual Message Distinction (Priority: P1)

**Goal**: User messages and AI messages have distinct visual styles following DoNext design system

**Independent Test**: View conversation with multiple messages, confirm user messages are indigo/right-aligned and AI messages are gray/left-aligned

### Implementation for User Story 2

- [x] T015 [US2] Style user messages with indigo background and right alignment in frontend/components/chat/chat-message.tsx
- [x] T016 [US2] Style AI messages with gray background and left alignment in frontend/components/chat/chat-message.tsx
- [x] T017 [US2] Add message bubble styling with proper border radius in frontend/components/chat/chat-message.tsx
- [x] T018 [US2] Add text wrapping and max-width constraints for readability in frontend/components/chat/chat-message.tsx

**Checkpoint**: User Story 2 complete - messages visually distinct

---

## Phase 5: User Story 3 - Loading and Processing Indicators (Priority: P1)

**Goal**: Users see feedback when AI is processing and input is disabled during that time

**Independent Test**: Send message, verify loading indicator shows, input disabled, then both restore when response arrives

### Implementation for User Story 3

- [x] T019 [US3] Add isLoading state to ChatContainer with state management in frontend/components/chat/chat-container.tsx
- [x] T020 [US3] Show ChatLoading component when isLoading is true in frontend/components/chat/chat-container.tsx
- [x] T021 [US3] Disable ChatInput when isLoading is true in frontend/components/chat/chat-input.tsx
- [x] T022 [US3] Add loading spinner to send button during loading in frontend/components/chat/chat-input.tsx
- [x] T023 [US3] Re-enable input when response received or error occurs in frontend/components/chat/chat-container.tsx

**Checkpoint**: User Story 3 complete - loading states work correctly

---

## Phase 6: User Story 4 - Auto-scroll and Message History (Priority: P2)

**Goal**: Chat auto-scrolls to new messages and loads history on page refresh

**Independent Test**: Send multiple messages, verify auto-scroll; refresh page, verify history loads

### Implementation for User Story 4

- [x] T024 [US4] Add messagesEndRef for scroll tracking in frontend/components/chat/chat-container.tsx
- [x] T025 [US4] Implement scrollToBottom with smooth behavior in frontend/components/chat/chat-container.tsx
- [x] T026 [US4] Add scroll position tracking to preserve when user scrolls up in frontend/components/chat/chat-container.tsx
- [x] T027 [US4] Store conversationId in localStorage for persistence in frontend/components/chat/chat-container.tsx
- [x] T028 [US4] Load conversation history on mount when conversationId exists in frontend/components/chat/chat-container.tsx
- [x] T029 [US4] Add history loading skeleton state in frontend/components/chat/chat-container.tsx

**Checkpoint**: User Story 4 complete - auto-scroll and history work

---

## Phase 7: User Story 5 - Keyboard Navigation (Priority: P2)

**Goal**: Enter sends message, Shift+Enter adds new line, textarea grows with content

**Independent Test**: Press Enter to send, press Shift+Enter for new line, verify textarea grows

### Implementation for User Story 5

- [x] T030 [US5] Implement handleKeyDown with Enter/Shift+Enter logic in frontend/components/chat/chat-input.tsx
- [x] T031 [US5] Add auto-resize textarea with useEffect in frontend/components/chat/chat-input.tsx
- [x] T032 [US5] Add character counter near limit (1800+/2000) in frontend/components/chat/chat-input.tsx
- [x] T033 [US5] Return focus to input after send completes in frontend/components/chat/chat-container.tsx

**Checkpoint**: User Story 5 complete - keyboard navigation works

---

## Phase 8: User Story 6 - View Toggle (Priority: P2)

**Goal**: Users can switch between chat and traditional task list views

**Independent Test**: Click toggle in chat view, navigate to tasks; click toggle in tasks, navigate to chat

### Implementation for User Story 6

- [x] T034 [US6] Add Chat link to dashboard navigation in frontend/app/dashboard/dashboard-nav.tsx
- [x] T035 [US6] Add view toggle button in chat header in frontend/components/chat/chat-container.tsx
- [x] T036 [US6] Add active indicator showing current view mode in frontend/app/dashboard/dashboard-nav.tsx

**Checkpoint**: User Story 6 complete - view toggle works

---

## Phase 9: User Story 7 - New Conversation (Priority: P2)

**Goal**: Users can start a fresh conversation to begin a new topic

**Independent Test**: Click "New Conversation", verify chat clears and new session begins

### Implementation for User Story 7

- [x] T037 [US7] Add New Conversation button to chat header in frontend/components/chat/chat-container.tsx
- [x] T038 [US7] Implement startNewConversation handler that clears state in frontend/components/chat/chat-container.tsx
- [x] T039 [US7] Clear localStorage conversationId on new conversation in frontend/components/chat/chat-container.tsx
- [x] T040 [US7] Show empty state after starting new conversation in frontend/components/chat/chat-container.tsx

**Checkpoint**: User Story 7 complete - new conversation works

---

## Phase 10: User Story 8 - Tool Call Indicators (Priority: P3)

**Goal**: Users see which tools the AI used to complete their request

**Independent Test**: Ask to add a task, verify tool badge shows "Added task" in AI response

### Implementation for User Story 8

- [x] T041 [US8] Render ToolCallBadge components in ChatMessage when toolCalls present in frontend/components/chat/chat-message.tsx
- [x] T042 [US8] Style tool badges with pill design and subtle background in frontend/components/chat/tool-call-badge.tsx
- [x] T043 [US8] Add success/failure icons to tool badges in frontend/components/chat/tool-call-badge.tsx

**Checkpoint**: User Story 8 complete - tool indicators display

---

## Phase 11: User Story 9 - Responsive Mobile (Priority: P2)

**Goal**: Chat interface works well on mobile devices (320px+)

**Independent Test**: Open chat on mobile viewport, verify full-width layout, fixed bottom input, keyboard handling

### Implementation for User Story 9

- [x] T044 [US9] Add responsive breakpoints to chat container (full-width <768px) in frontend/components/chat/chat-container.tsx
- [x] T045 [US9] Fix input area to bottom on mobile with proper spacing in frontend/components/chat/chat-input.tsx
- [x] T046 [US9] Add viewport height handling for mobile keyboards in frontend/components/chat/chat-container.tsx
- [x] T047 [US9] Test and fix message bubble widths on narrow screens in frontend/components/chat/chat-message.tsx

**Checkpoint**: User Story 9 complete - mobile responsive

---

## Phase 12: User Story 10 - Empty State (Priority: P2)

**Goal**: New users see a welcoming message with guidance on first visit

**Independent Test**: Open chat with no history, verify welcome message displays with example prompts

### Implementation for User Story 10

- [x] T048 [US10] Add welcome message content to ChatEmptyState in frontend/components/chat/chat-empty-state.tsx
- [x] T049 [US10] Add example prompt suggestions to empty state in frontend/components/chat/chat-empty-state.tsx
- [x] T050 [US10] Render ChatEmptyState when messages array is empty in frontend/components/chat/chat-container.tsx
- [x] T051 [US10] Hide empty state once first message is sent in frontend/components/chat/chat-container.tsx

**Checkpoint**: User Story 10 complete - empty state shows for new users

---

## Phase 13: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [x] T052 [P] Add unit tests for ChatMessage component in frontend/__tests__/components/chat/chat-message.test.tsx
- [x] T053 [P] Add unit tests for ChatInput component in frontend/__tests__/components/chat/chat-input.test.tsx
- [x] T054 [P] Add unit tests for ChatContainer component in frontend/__tests__/components/chat/chat-container.test.tsx
- [x] T055 [P] Add integration test for full chat flow in frontend/__tests__/integration/chat.test.tsx
- [x] T056 Accessibility audit and ARIA label additions across all chat components
- [x] T057 Performance check for message rendering with 100+ messages
- [x] T058 Run quickstart.md validation checklist

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup (T001-T003) - BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
  - US1 (Phase 3) → US2 (Phase 4) → US3 (Phase 5) are sequential (P1 priority)
  - US4-US10 (Phase 6-12) can proceed after US1-3 complete
- **Polish (Phase 13)**: Depends on all desired user stories being complete

### User Story Dependencies

- **US1 (P1)**: Foundational only - MVP core functionality
- **US2 (P1)**: Depends on US1 (needs ChatMessage component)
- **US3 (P1)**: Depends on US1 (needs ChatContainer state)
- **US4 (P2)**: Depends on US1-3 (needs working chat flow)
- **US5 (P2)**: Depends on US1 (enhances ChatInput)
- **US6 (P2)**: Independent after Foundational (navigation only)
- **US7 (P2)**: Depends on US4 (needs history/localStorage)
- **US8 (P3)**: Depends on US1-2 (enhances ChatMessage)
- **US9 (P2)**: Depends on US1-3 (responsive enhancement)
- **US10 (P2)**: Depends on US1 (needs ChatContainer)

### Within Each User Story

- Models/types before components
- Atomic components before container
- Core implementation before enhancements
- Story complete before moving to next priority

### Parallel Opportunities

- T002, T003 can run in parallel (different files)
- T004, T005, T006, T007 can run in parallel (independent components)
- T015-T018 within US2 affect same file - sequential
- T052, T053, T054, T055 tests can run in parallel
- Different user stories can be worked on in parallel by different developers

---

## Parallel Example: Foundational Phase

```bash
# Launch all foundational components together:
Task T004: "Create ToolCallBadge component in frontend/components/chat/tool-call-badge.tsx"
Task T005: "Create ChatLoading component in frontend/components/chat/chat-loading.tsx"
Task T006: "Create ChatError component in frontend/components/chat/chat-error.tsx"
Task T007: "Create ChatEmptyState component in frontend/components/chat/chat-empty-state.tsx"
```

---

## Parallel Example: Tests Phase

```bash
# Launch all unit tests together:
Task T052: "Add unit tests for ChatMessage in frontend/__tests__/components/chat/chat-message.test.tsx"
Task T053: "Add unit tests for ChatInput in frontend/__tests__/components/chat/chat-input.test.tsx"
Task T054: "Add unit tests for ChatContainer in frontend/__tests__/components/chat/chat-container.test.tsx"
```

---

## Implementation Strategy

### MVP First (User Stories 1-3 Only)

1. Complete Phase 1: Setup (T001-T003)
2. Complete Phase 2: Foundational (T004-T007)
3. Complete Phase 3: US1 - View and Send Messages (T008-T014)
4. Complete Phase 4: US2 - Visual Distinction (T015-T018)
5. Complete Phase 5: US3 - Loading Indicators (T019-T023)
6. **STOP and VALIDATE**: Test MVP independently
7. Deploy/demo if ready - basic chat functionality complete!

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add US1-3 → Test MVP → Deploy (Core chat works!)
3. Add US4 (History) → Test → Deploy (Persistence works!)
4. Add US5 (Keyboard) → Test → Deploy (UX improved!)
5. Add US6-7 (Toggle, New) → Test → Deploy (Navigation works!)
6. Add US8 (Tools) → Test → Deploy (Transparency added!)
7. Add US9-10 (Mobile, Empty) → Test → Deploy (Polish complete!)
8. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. All complete Setup + Foundational together
2. Once Foundational is done:
   - Developer A: US1-3 (core MVP)
   - Developer B: US6 (navigation - independent)
3. After MVP:
   - Developer A: US4, US5, US7
   - Developer B: US8, US9, US10
4. All: Polish & tests

---

## Summary

| Metric | Count |
|--------|-------|
| Total Tasks | 58 |
| Setup Tasks | 3 |
| Foundational Tasks | 4 |
| User Story Tasks | 44 |
| Polish Tasks | 7 |
| Parallel Opportunities | 15 |
| User Stories | 10 |

### Tasks per User Story

| Story | Priority | Tasks | Files |
|-------|----------|-------|-------|
| US1 | P1 | 7 | 5 |
| US2 | P1 | 4 | 1 |
| US3 | P1 | 5 | 2 |
| US4 | P2 | 6 | 1 |
| US5 | P2 | 4 | 2 |
| US6 | P2 | 3 | 2 |
| US7 | P2 | 4 | 1 |
| US8 | P3 | 3 | 2 |
| US9 | P2 | 4 | 3 |
| US10 | P2 | 4 | 2 |

### Suggested MVP Scope

**Minimum Viable Chat** = US1 + US2 + US3 (P1 stories only)
- 16 tasks (T008-T023)
- Core send/receive, visual distinction, loading states
- Can be completed and demoed independently

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Mock API responses if 004-chat-api not ready (see quickstart.md)

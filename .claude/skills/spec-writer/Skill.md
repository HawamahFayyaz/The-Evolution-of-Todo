name: spec-writer
description: Generate feature specifications following SpecKitPlus methodology

# Spec Writer Skill

## Purpose
Create comprehensive feature specifications that guide implementation and serve as living documentation throughout the project lifecycle.

## Core Principles
1. **Constitution-First**: Every spec must align with project constitution
2. **User-Centric**: Start with user stories, not technical details
3. **Testable**: Acceptance criteria must be measurable
4. **Explicit**: Define boundaries, edge cases, and error conditions
5. **Living Document**: Specs evolve with the feature

## When to Use
- Starting any new feature
- Planning Phase transitions
- Clarifying ambiguous requirements
- Documenting existing features (retroactively)
- Creating acceptance test templates

## When NOT to Use
- Quick bug fixes (use issue tracker)
- Exploratory prototypes (spike first, spec later)
- Obvious typo corrections

## Spec Template
````markdown
# Feature: [Feature Name]

## Constitution Alignment
Reference relevant principles from project constitution.
Example: "Aligns with User Autonomy principle - users control their data"

## User Story
AS A [role]
I WANT TO [action/goal]
SO THAT [benefit/value]

## Acceptance Criteria
- [ ] Criterion 1 (testable, measurable)
- [ ] Criterion 2
- [ ] Criterion 3

## Edge Cases
| Scenario | Expected Behavior |
|----------|-------------------|
| Empty input | Show validation error |
| Max length exceeded | Truncate or reject with message |

## Business Rules
**ALWAYS:**
- Rule 1
- Rule 2

**NEVER:**
- Anti-pattern 1
- Anti-pattern 2

## Dependencies
- Feature X must be completed first
- API endpoint Y must exist
- Database table Z must have column A

## Out of Scope
Explicitly state what this feature does NOT include.

## Technical Notes
Implementation hints (optional):
- Suggested approach
- Performance considerations
- Security considerations
````

## Complete Example: "Mark Task as Complete"
````markdown
# Feature: Mark Task as Complete

## Constitution Alignment
Aligns with "Accessibility First" - simple, intuitive action for users to track progress.

## User Story
AS A user with pending tasks
I WANT TO mark tasks as complete
SO THAT I can track my progress and reduce my to-do list

## Acceptance Criteria
- [ ] User can click/tap a task to toggle its completion status
- [ ] Completed tasks show visual indicator (checkmark, strikethrough, color change)
- [ ] Task completion status persists after page refresh
- [ ] Completed tasks remain visible (not deleted)
- [ ] User can undo completion (toggle back to pending)
- [ ] Completion timestamp is recorded (for future reporting)

## Edge Cases
| Scenario | Expected Behavior |
|----------|-------------------|
| User clicks same task twice rapidly | Only one state change (debounce) |
| Task already completed | Toggle back to pending |
| Network error during save | Show error, revert UI, allow retry |
| Task doesn't exist (deleted by another user) | Show "Task not found" error |

## Business Rules
**ALWAYS:**
- Record who completed the task (user_id)
- Record when task was completed (completed_at timestamp)
- Update updated_at timestamp

**NEVER:**
- Delete completed tasks (soft delete only if user explicitly deletes)
- Allow completion of tasks belonging to other users
- Complete tasks without user authentication

## Dependencies
- Tasks table must have `completed` boolean column
- Tasks table must have `completed_at` datetime column
- User must be authenticated (JWT token)
- API endpoint PUT /api/{user_id}/tasks/{task_id} must exist

## Out of Scope
- Bulk completion (complete multiple tasks at once) - separate feature
- Recurring task logic (e.g., reset completion daily) - Phase V feature
- Completion notifications - separate feature

## Technical Notes
**Frontend (Next.js):**
- Optimistic UI update (update immediately, rollback on error)
- Use SWR or React Query for cache invalidation

**Backend (FastAPI):**
- Endpoint: PUT /api/{user_id}/tasks/{task_id}
- Body: `{"completed": true}`
- Response: Updated task object

**Database (SQLModel):**
```python
completed: bool = Field(default=False, index=True)
completed_at: Optional[datetime] = Field(default=None)
```

## API Contract
See: `specs/api/complete-task.md`
````

## Quality Checklist

Use this to review specs before approval:

- [ ] **User Story** written in "AS A... I WANT... SO THAT..." format
- [ ] **Acceptance Criteria** are testable (no vague terms like "fast" or "user-friendly")
- [ ] **Edge Cases** cover error conditions, boundary values, race conditions
- [ ] **Business Rules** use explicit ALWAYS/NEVER statements
- [ ] **Dependencies** list prerequisites clearly
- [ ] **Out of Scope** prevents scope creep
- [ ] **Constitution Alignment** references specific principles
- [ ] **Technical Notes** (if needed) don't prescribe implementation

## Usage Instructions

### Creating a New Spec
@.claude/skills/spec-writer/spec-writer.md
Generate feature spec for "[Feature Name]".
Context: [Describe project context, current phase, relevant constraints]
User Story: [If known, provide the user story]
Requirements: [List any known requirements]
Constitution Reference: @specs/constitution.md
Save to: specs/features/[feature-name].md

### Reviewing a Spec
@.claude/skills/spec-writer/spec-writer.md
Review the following spec against the quality checklist:
@specs/features/[feature-name].md
Check for:

Completeness (all sections present?)
Testability (measurable acceptance criteria?)
Clarity (no ambiguity?)
Alignment (matches constitution?)

Provide list of issues and recommendations.

## Common Mistakes ❌

| Mistake | Fix |
|---------|-----|
| ❌ Vague acceptance criteria ("should be fast") | ✅ Specific criteria ("responds in <200ms at p95") |
| ❌ Missing edge cases | ✅ Think: empty input, max values, race conditions, errors |
| ❌ Implementation details in spec | ✅ Focus on WHAT, not HOW (technical notes optional) |
| ❌ No business rules | ✅ Add ALWAYS/NEVER statements |
| ❌ Scope creep (too many features in one spec) | ✅ One feature per spec, list out-of-scope items |

## Related Skills
- api-spec-generator (for API endpoints)
- database-schema (for data models)
- test-generator (converts acceptance criteria to tests)

## Related Agents
- spec-architect (reviews and approves specs)

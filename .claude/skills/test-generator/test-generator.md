---
name: test-generator
description: Generate test cases from acceptance criteria for pytest (backend) and Jest (frontend)
---

# Test Generator Skill

## Purpose
Automatically convert acceptance criteria from feature specs into comprehensive test suites, ensuring every requirement is verified.

## Core Principles
1. **One test per acceptance criterion**
2. **Descriptive test names** - test name explains what's being tested
3. **Arrange-Act-Assert pattern** - setup, execute, verify
4. **80%+ code coverage target**
5. **Fast tests** - unit tests <1s, integration tests <5s

## When to Use
- After feature specs are approved
- Before implementation (TDD approach)
- Adding tests to existing features
- Achieving coverage targets

## Test Types

| Type | Scope | Speed | When to Use |
|------|-------|-------|-------------|
| **Unit** | Single function/class | <100ms | Testing business logic, utilities |
| **Integration** | Multiple components | <1s | Testing API endpoints, database operations |
| **E2E** | Full user flow | <10s | Testing critical paths (login, checkout) |

## Backend Testing (pytest + FastAPI)

### Project Structure
```
backend/
├── app/
│   ├── models.py
│   ├── routes.py
│   └── services.py
└── tests/
    ├── conftest.py          # Fixtures
    ├── unit/
    │   ├── test_models.py
    │   └── test_services.py
    ├── integration/
    │   └── test_api.py
    └── e2e/
        └── test_user_flow.py
```

### Complete Example: Testing Task Creation

**From Feature Spec** (`specs/features/add-task.md`):
```markdown
## Acceptance Criteria
- [ ] User can create task with title
- [ ] Title is required (1-200 chars)
- [ ] Description is optional (max 1000 chars)
- [ ] Task gets unique ID
- [ ] created_at timestamp is set
- [ ] Response returns created task
```

**Generated Tests** (`tests/integration/test_tasks.py`):
```python
import pytest
from fastapi.testclient import TestClient
from datetime import datetime, timezone
from app.main import app
from app.database import get_session
from app.models import Task, User

client = TestClient(app)

# ==================== FIXTURES ====================

@pytest.fixture
def auth_user(test_session):
    """Create authenticated user and return JWT token"""
    user = User(
        id="test_user_123",
        email="test@example.com",
        name="Test User"
    )
    test_session.add(user)
    test_session.commit()

    # Login to get token
    response = client.post("/api/auth/login", json={
        "email": "test@example.com",
        "password": "password123"
    })
    return response.json()["access_token"]

@pytest.fixture
def auth_headers(auth_user):
    """Return headers with JWT token"""
    return {"Authorization": f"Bearer {auth_user}"}

# ==================== TESTS ====================

def test_create_task_with_title_succeeds(auth_headers):
    """
    Acceptance Criterion: User can create task with title

    Given: Authenticated user
    When: POST /api/test_user_123/tasks with valid title
    Then: Task is created with 201 status
    """
    response = client.post(
        "/api/test_user_123/tasks",
        headers=auth_headers,
        json={"title": "Buy groceries"}
    )

    assert response.status_code == 201
    data = response.json()
    assert data["title"] == "Buy groceries"
    assert "id" in data
    assert data["user_id"] == "test_user_123"

def test_create_task_title_required(auth_headers):
    """
    Acceptance Criterion: Title is required

    Given: Authenticated user
    When: POST without title
    Then: 422 validation error returned
    """
    response = client.post(
        "/api/test_user_123/tasks",
        headers=auth_headers,
        json={"description": "No title provided"}
    )

    assert response.status_code == 422
    data = response.json()
    assert data["code"] == "VALIDATION_ERROR"
    assert "title" in data["error"].lower()

def test_create_task_title_min_length(auth_headers):
    """
    Acceptance Criterion: Title is 1-200 chars

    Given: Authenticated user
    When: POST with empty title
    Then: 422 validation error
    """
    response = client.post(
        "/api/test_user_123/tasks",
        headers=auth_headers,
        json={"title": ""}
    )

    assert response.status_code == 422

def test_create_task_title_max_length(auth_headers):
    """
    Acceptance Criterion: Title is 1-200 chars

    Given: Authenticated user
    When: POST with 201-character title
    Then: 422 validation error
    """
    long_title = "A" * 201
    response = client.post(
        "/api/test_user_123/tasks",
        headers=auth_headers,
        json={"title": long_title}
    )

    assert response.status_code == 422

def test_create_task_description_optional(auth_headers):
    """
    Acceptance Criterion: Description is optional

    Given: Authenticated user
    When: POST without description
    Then: Task created successfully
    """
    response = client.post(
        "/api/test_user_123/tasks",
        headers=auth_headers,
        json={"title": "Task without description"}
    )

    assert response.status_code == 201
    data = response.json()
    assert data["description"] is None

def test_create_task_description_max_length(auth_headers):
    """
    Acceptance Criterion: Description max 1000 chars

    Given: Authenticated user
    When: POST with 1001-character description
    Then: 422 validation error
    """
    long_desc = "A" * 1001
    response = client.post(
        "/api/test_user_123/tasks",
        headers=auth_headers,
        json={
            "title": "Task",
            "description": long_desc
        }
    )

    assert response.status_code == 422

def test_create_task_gets_unique_id(auth_headers, test_session):
    """
    Acceptance Criterion: Task gets unique ID

    Given: Authenticated user
    When: Create two tasks
    Then: Each has different ID
    """
    response1 = client.post(
        "/api/test_user_123/tasks",
        headers=auth_headers,
        json={"title": "Task 1"}
    )
    response2 = client.post(
        "/api/test_user_123/tasks",
        headers=auth_headers,
        json={"title": "Task 2"}
    )

    id1 = response1.json()["id"]
    id2 = response2.json()["id"]
    assert id1 != id2

def test_create_task_sets_created_at(auth_headers):
    """
    Acceptance Criterion: created_at timestamp is set

    Given: Authenticated user
    When: Create task
    Then: created_at is present and valid ISO 8601
    """
    before = datetime.now(timezone.utc)

    response = client.post(
        "/api/test_user_123/tasks",
        headers=auth_headers,
        json={"title": "Timestamped task"}
    )

    after = datetime.now(timezone.utc)

    data = response.json()
    assert "created_at" in data

    created_at = datetime.fromisoformat(data["created_at"].replace("Z", "+00:00"))
    assert before <= created_at <= after

def test_create_task_returns_created_task(auth_headers):
    """
    Acceptance Criterion: Response returns created task

    Given: Authenticated user
    When: Create task
    Then: Response contains all task fields
    """
    response = client.post(
        "/api/test_user_123/tasks",
        headers=auth_headers,
        json={
            "title": "Complete task",
            "description": "With description"
        }
    )

    data = response.json()
    assert "id" in data
    assert data["title"] == "Complete task"
    assert data["description"] == "With description"
    assert "created_at" in data
    assert "updated_at" in data
    assert data["completed"] is False

def test_create_task_unauthorized_without_token():
    """
    Edge Case: No authentication token

    Given: No auth token
    When: POST to create task
    Then: 401 Unauthorized
    """
    response = client.post(
        "/api/test_user_123/tasks",
        json={"title": "Unauthorized task"}
    )

    assert response.status_code == 401

def test_create_task_forbidden_for_other_user(auth_headers):
    """
    Edge Case: User tries to create task for another user

    Given: Authenticated as user_123
    When: POST to /api/user_456/tasks
    Then: 403 Forbidden
    """
    response = client.post(
        "/api/user_456/tasks",
        headers=auth_headers,
        json={"title": "Task for another user"}
    )

    assert response.status_code == 403
```

### Fixtures Pattern (conftest.py)
```python
import pytest
from sqlmodel import Session, create_engine, SQLModel
from sqlalchemy.pool import StaticPool
from app.database import get_session
from app.main import app

# In-memory SQLite for tests
@pytest.fixture(scope="function")
def test_session():
    """Create fresh database for each test"""
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool
    )
    SQLModel.metadata.create_all(engine)

    with Session(engine) as session:
        yield session

    SQLModel.metadata.drop_all(engine)

@pytest.fixture
def override_get_session(test_session):
    """Override dependency injection"""
    def _override():
        yield test_session

    app.dependency_overrides[get_session] = _override
    yield
    app.dependency_overrides.clear()
```

## Frontend Testing (Jest + React Testing Library)

### Project Structure
```
frontend/
├── app/
│   ├── components/
│   │   └── AddTaskForm.tsx
│   └── lib/
│       └── api.ts
└── tests/
    ├── components/
    │   └── AddTaskForm.test.tsx
    └── lib/
        └── api.test.ts
```

### Complete Example: Testing Add Task Form
```typescript
// __tests__/components/AddTaskForm.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AddTaskForm } from '@/app/components/AddTaskForm';
import { api } from '@/app/lib/api';

// Mock API
jest.mock('@/app/lib/api');
const mockApi = api as jest.Mocked<typeof api>;

describe('AddTaskForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders title input field', () => {
    /**
     * Acceptance Criterion: User sees title input
     */
    render(<AddTaskForm />);

    const titleInput = screen.getByPlaceholderText(/add a task/i);
    expect(titleInput).toBeInTheDocument();
  });

  test('submits task with valid title', async () => {
    /**
     * Acceptance Criterion: User can submit task with title
     */
    mockApi.createTask.mockResolvedValue({
      id: 1,
      title: 'Buy groceries',
      completed: false
    });

    render(<AddTaskForm />);

    const input = screen.getByPlaceholderText(/add a task/i);
    const submitButton = screen.getByRole('button', { name: /add/i });

    await userEvent.type(input, 'Buy groceries');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockApi.createTask).toHaveBeenCalledWith({
        title: 'Buy groceries'
      });
    });
  });

  test('shows error when title is empty', async () => {
    /**
     * Acceptance Criterion: Title is required
     */
    render(<AddTaskForm />);

    const submitButton = screen.getByRole('button', { name: /add/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/title is required/i)).toBeInTheDocument();
    });

    expect(mockApi.createTask).not.toHaveBeenCalled();
  });

  test('clears input after successful submission', async () => {
    /**
     * Acceptance Criterion: Form resets after submit
     */
    mockApi.createTask.mockResolvedValue({
      id: 1,
      title: 'Task',
      completed: false
    });

    render(<AddTaskForm />);

    const input = screen.getByPlaceholderText(/add a task/i) as HTMLInputElement;
    await userEvent.type(input, 'Task');
    fireEvent.click(screen.getByRole('button', { name: /add/i }));

    await waitFor(() => {
      expect(input.value).toBe('');
    });
  });
});
```

## Test Coverage Requirements

### Coverage Targets
- **Overall**: 80%+
- **Critical paths** (auth, payments): 95%+
- **Utilities**: 90%+
- **UI components**: 70%+

### Running Coverage
```bash
# Backend
pytest tests/ --cov=app --cov-report=html --cov-report=term-missing

# Frontend
npm test -- --coverage --coverageReporters=html --coverageReporters=text
```

### Coverage Report Interpretation
```
Name                    Stmts   Miss  Cover   Missing
-----------------------------------------------------
app/models.py              45      2    96%   23, 67
app/routes.py              89      8    91%   45-52
app/services.py            67     15    78%   12-18, 45-52
-----------------------------------------------------
TOTAL                     201     25    88%
```

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| Vague test names (`test_function_1`) | Descriptive names (`test_create_task_with_valid_title_succeeds`) |
| Testing implementation details | Test behavior, not internals |
| No edge case tests | Test empty inputs, boundary values, errors |
| Slow tests (>1s for unit tests) | Mock external dependencies |
| Tests depend on each other | Each test is independent |
| No assertions | Every test must have assert |

## Usage Instructions

### Generate Tests from Feature Spec
@.claude/skills/test-generator/test-generator.md
Generate pytest tests from feature spec:
@specs/features/add-task.md
For each acceptance criterion, create:

Test function with descriptive name
Docstring explaining what's being tested
Arrange-Act-Assert structure
Edge case tests

Save to: backend/tests/integration/test_add_task.py

### Generate Complete Test Suite
@.claude/skills/test-generator/test-generator.md
Generate complete test suite for Task CRUD operations.
Feature specs:

@specs/features/add-task.md
@specs/features/list-tasks.md
@specs/features/update-task.md
@specs/features/delete-task.md
@specs/features/complete-task.md

Include:

Unit tests (models, services)
Integration tests (API endpoints)
Edge cases (auth, validation, errors)
Fixtures (test data, mocks)

Target: 80%+ coverage
Save to: backend/tests/

---
name: database-schema
description: Generate SQLModel schemas with audit fields, soft deletes, and indexes for Neon PostgreSQL
---

# Database Schema Skill

## Purpose
Generate production-ready SQLModel schemas for Neon Serverless PostgreSQL with mandatory audit fields, soft deletes, and proper indexing.

## Core Rules (NEVER BREAK)
1. **Every table MUST have**: id, created_at, updated_at, deleted_at
2. **Every foreign key MUST be indexed**
3. **Always use soft deletes** (set deleted_at, never hard delete)
4. **Use UTC timestamps**: `datetime.now(timezone.utc)`
5. **Add constraints**: max_length, min_length, ge, le

## When to Use
- Designing new data models
- Creating SQLModel classes
- Planning table relationships
- Adding indexes for query optimization

## Complete Example
```python
from sqlmodel import SQLModel, Field, Relationship
from datetime import datetime, timezone
from typing import Optional

# Base model with audit fields (inherit from this)
class BaseModel(SQLModel):
    id: Optional[int] = Field(default=None, primary_key=True)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    deleted_at: Optional[datetime] = Field(default=None, index=True)  # Soft delete

# User table
class User(BaseModel, table=True):
    __tablename__ = "users"

    email: str = Field(max_length=255, unique=True, index=True)
    name: str = Field(max_length=100)

    # Relationships
    tasks: list["Task"] = Relationship(back_populates="user")
    conversations: list["Conversation"] = Relationship(back_populates="user")

# Task table
class Task(BaseModel, table=True):
    __tablename__ = "tasks"

    user_id: int = Field(foreign_key="users.id", index=True)  # Always indexed!
    title: str = Field(max_length=200)
    description: Optional[str] = Field(default=None, max_length=1000)
    completed: bool = Field(default=False, index=True)  # Index for filtering
    due_date: Optional[datetime] = Field(default=None)

    # Relationships
    user: User = Relationship(back_populates="tasks")
    tags: list["Tag"] = Relationship(back_populates="tasks", link_model="TaskTag")

# Tag table
class Tag(BaseModel, table=True):
    __tablename__ = "tags"

    name: str = Field(max_length=50, unique=True, index=True)
    color: str = Field(max_length=7, default="#3B82F6")  # Hex color

    # Relationships
    tasks: list[Task] = Relationship(back_populates="tags", link_model="TaskTag")

# Junction table for many-to-many (Task <-> Tag)
class TaskTag(BaseModel, table=True):
    __tablename__ = "task_tags"

    task_id: int = Field(foreign_key="tasks.id", index=True, primary_key=True)
    tag_id: int = Field(foreign_key="tags.id", index=True, primary_key=True)

    # No relationships needed in junction table

# Conversation table (for AI chatbot)
class Conversation(BaseModel, table=True):
    __tablename__ = "conversations"

    user_id: int = Field(foreign_key="users.id", index=True)
    title: str = Field(max_length=200, default="New Chat")

    # Relationships
    user: User = Relationship(back_populates="conversations")
    messages: list["Message"] = Relationship(back_populates="conversation")

# Message table (conversation history)
class Message(BaseModel, table=True):
    __tablename__ = "messages"

    conversation_id: int = Field(foreign_key="conversations.id", index=True)
    role: str = Field(max_length=20)  # "user" or "assistant"
    content: str = Field(max_length=10000)

    # Composite index for fetching conversation history
    __table_args__ = (
        Index("idx_conversation_created", "conversation_id", "created_at"),
    )

    # Relationships
    conversation: Conversation = Relationship(back_populates="messages")
```

## Neon Serverless Database Setup
```python
# database.py
from sqlmodel import create_engine, Session
from sqlalchemy.pool import NullPool

# Neon connection string
DATABASE_URL = "postgresql://user:pass@host.neon.tech/dbname?sslmode=require"

# Use NullPool for serverless (FastAPI on Vercel, etc.)
engine = create_engine(
    DATABASE_URL,
    echo=True,  # Log SQL queries (disable in production)
    poolclass=NullPool  # No connection pooling for serverless
)

def get_session():
    with Session(engine) as session:
        yield session
```

## Soft Delete Pattern
```python
# CRUD operations
from sqlmodel import select

def get_active_tasks(user_id: int, session: Session):
    """Get tasks that are NOT deleted"""
    statement = select(Task).where(
        Task.user_id == user_id,
        Task.deleted_at.is_(None)  # Only active tasks
    )
    return session.exec(statement).all()

def soft_delete_task(task_id: int, session: Session):
    """Soft delete: set deleted_at instead of DELETE"""
    task = session.get(Task, task_id)
    if task:
        task.deleted_at = datetime.now(timezone.utc)
        task.updated_at = datetime.now(timezone.utc)
        session.commit()
```

## Common Mistakes ❌

| Mistake | Fix |
|---------|-----|
| ❌ Missing audit fields | ✅ Always include: id, created_at, updated_at, deleted_at |
| ❌ Foreign key not indexed | ✅ Add `index=True` to all foreign keys |
| ❌ Hard deletes (DELETE SQL) | ✅ Use soft delete (set deleted_at) |
| ❌ `datetime.utcnow()` | ✅ Use `datetime.now(timezone.utc)` |
| ❌ No max_length on strings | ✅ Always set max_length |
| ❌ Missing Optional for nullable | ✅ Use `Optional[type]` for nullable fields |

## Index Guidelines

### Always Index:
- Primary keys (automatic)
- Foreign keys (manual: `index=True`)
- `deleted_at` (for filtering active records)
- Fields used in WHERE clauses (e.g., `completed`, `email`)

### Composite Indexes:
```python
from sqlalchemy import Index

class Message(BaseModel, table=True):
    # ...
    __table_args__ = (
        Index("idx_conversation_created", "conversation_id", "created_at"),
    )
```

## Relationship Patterns

### One-to-Many (User → Tasks)
```python
class User(BaseModel, table=True):
    tasks: list["Task"] = Relationship(back_populates="user")

class Task(BaseModel, table=True):
    user_id: int = Field(foreign_key="users.id", index=True)
    user: User = Relationship(back_populates="tasks")
```

### Many-to-Many (Tasks ↔ Tags)
```python
class Task(BaseModel, table=True):
    tags: list["Tag"] = Relationship(back_populates="tasks", link_model="TaskTag")

class Tag(BaseModel, table=True):
    tasks: list[Task] = Relationship(back_populates="tags", link_model="TaskTag")

class TaskTag(BaseModel, table=True):
    task_id: int = Field(foreign_key="tasks.id", primary_key=True)
    tag_id: int = Field(foreign_key="tags.id", primary_key=True)
```

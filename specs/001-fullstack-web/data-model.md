# Data Model: Multi-User Todo Application

**Feature**: 001-fullstack-web
**Created**: 2026-01-15
**Status**: Draft
**Database**: PostgreSQL (Neon Serverless)

## Overview

This document defines the database schema for the Phase II multi-user todo application. The schema supports user authentication (via Better Auth) and user-scoped task management.

## Entity Relationship Diagram

```
┌─────────────────┐       ┌─────────────────┐
│     users       │       │     tasks       │
├─────────────────┤       ├─────────────────┤
│ id (PK)         │◄──────│ user_id (FK)    │
│ email           │   1:N │ id (PK)         │
│ name            │       │ title           │
│ created_at      │       │ description     │
│ updated_at      │       │ completed       │
└─────────────────┘       │ created_at      │
                          │ updated_at      │
                          └─────────────────┘
```

## Tables

### users (Managed by Better Auth)

**Note**: This table is created and managed automatically by Better Auth. Do not modify directly.

| Field      | Type         | Constraints     | Description              |
|------------|--------------|-----------------|--------------------------|
| id         | VARCHAR(255) | PRIMARY KEY     | UUID, auto-generated     |
| email      | VARCHAR(255) | UNIQUE NOT NULL | User's email address     |
| name       | VARCHAR(255) | NULL            | Display name             |
| created_at | TIMESTAMPTZ  | NOT NULL        | Account creation time    |
| updated_at | TIMESTAMPTZ  | NOT NULL        | Last modification time   |

**Additional Better Auth tables**: Better Auth may create additional tables for sessions, accounts, and verification tokens. These are managed automatically.

---

### tasks

| Field       | Type         | Constraints                        | Default            | Description          |
|-------------|--------------|------------------------------------|--------------------|----------------------|
| id          | SERIAL       | PRIMARY KEY                        | auto-increment     | Unique task ID       |
| user_id     | VARCHAR(255) | NOT NULL, FK → users.id            | -                  | Task owner           |
| title       | VARCHAR(200) | NOT NULL                           | -                  | Task title           |
| description | TEXT         | NOT NULL                           | '' (empty string)  | Task details         |
| completed   | BOOLEAN      | NOT NULL                           | false              | Completion status    |
| created_at  | TIMESTAMPTZ  | NOT NULL                           | CURRENT_TIMESTAMP  | Creation timestamp   |
| updated_at  | TIMESTAMPTZ  | NOT NULL                           | CURRENT_TIMESTAMP  | Last modified        |

## Indexes

| Index Name            | Table | Columns          | Type      | Purpose                    |
|-----------------------|-------|------------------|-----------|----------------------------|
| tasks_pkey            | tasks | id               | PRIMARY   | Primary key                |
| idx_tasks_user_id     | tasks | user_id          | BTREE     | Filter by user (critical)  |
| idx_tasks_completed   | tasks | completed        | BTREE     | Filter by status           |
| idx_tasks_created_at  | tasks | created_at DESC  | BTREE     | Sort by creation date      |

## Constraints

### tasks Table

```sql
-- Foreign key with cascade delete
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE

-- Title length validation (1-200 characters)
CHECK (LENGTH(title) >= 1 AND LENGTH(title) <= 200)

-- Description length validation (max 1000 characters)
CHECK (LENGTH(description) <= 1000)
```

## Field Validation Rules

### title
- **Required**: Yes
- **Min Length**: 1 character
- **Max Length**: 200 characters
- **Allowed**: Any UTF-8 characters
- **Trimmed**: Leading/trailing whitespace removed

### description
- **Required**: No
- **Default**: Empty string
- **Max Length**: 1000 characters
- **Allowed**: Any UTF-8 characters including newlines

### completed
- **Required**: Yes (enforced by NOT NULL)
- **Default**: false
- **Values**: true/false

## Timestamps

All timestamps use:
- **Type**: TIMESTAMP WITH TIME ZONE (TIMESTAMPTZ)
- **Format**: ISO 8601 UTC
- **Example**: `2025-12-30T10:00:00Z`

### created_at
- Set automatically on INSERT
- Never modified after creation

### updated_at
- Set automatically on INSERT
- Updated automatically on every UPDATE

## Data Isolation

**Critical Security Requirement**: All queries to the `tasks` table MUST filter by `user_id` to ensure users can only access their own data.

```sql
-- CORRECT: Always filter by authenticated user
SELECT * FROM tasks WHERE user_id = :authenticated_user_id;

-- WRONG: Never query without user filter
SELECT * FROM tasks WHERE id = :task_id;  -- Security violation!
```

## Cascade Behavior

| Relationship     | On User Delete    | Rationale                          |
|------------------|-------------------|------------------------------------|
| users → tasks    | CASCADE           | Delete user's tasks when user deleted |

## Migration Notes

1. **Phase I Data**: Not migrated (was in-memory only)
2. **Initial Setup**: Tables created automatically by ORM on first run
3. **Future Migrations**: Use Alembic for schema changes
4. **Soft Deletes**: Not implemented in Phase II schema (per constitution, this should be added)

## Soft Delete Extension (Recommended)

To comply with constitution requirement for soft deletes, add:

```sql
ALTER TABLE tasks ADD COLUMN deleted_at TIMESTAMPTZ NULL;
CREATE INDEX idx_tasks_deleted_at ON tasks(deleted_at);
```

Then filter queries: `WHERE deleted_at IS NULL`

## Database Setup

1. Create project on [neon.tech](https://neon.tech)
2. Obtain connection string from dashboard
3. Set environment variable:
   ```
   DATABASE_URL=postgresql://user:password@ep-xxx.region.neon.tech/dbname?sslmode=require
   ```
4. Tables created automatically on first application run

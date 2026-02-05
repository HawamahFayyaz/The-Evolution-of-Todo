# API Contract: Todo REST API

**Feature**: 001-fullstack-web
**Created**: 2026-01-15
**Status**: Draft
**Version**: 1.0.0

## Overview

This document defines the REST API contract for the Todo application's task management endpoints. All endpoints require JWT authentication and enforce user-scoped data isolation.

## Base URLs

| Environment | URL                        |
|-------------|----------------------------|
| Development | `http://localhost:8000`    |
| Production  | `https://your-api.com`     |

## Authentication

All endpoints require a JWT token in the Authorization header:

```
Authorization: Bearer <jwt_token>
```

The token contains the user's identity. User ID is **always** extracted from the token, never from request body or URL parameters.

## Common Error Responses

| Status Code | Name                    | Description                           |
|-------------|-------------------------|---------------------------------------|
| 401         | Unauthorized            | Missing or invalid token              |
| 403         | Forbidden               | Valid token but insufficient access   |
| 404         | Not Found               | Resource doesn't exist                |
| 422         | Unprocessable Entity    | Validation error                      |
| 500         | Internal Server Error   | Server error                          |

## Task Resource

### Schema

```json
{
  "id": 1,
  "user_id": "user_abc123",
  "title": "Buy groceries",
  "description": "Get milk and eggs",
  "completed": false,
  "created_at": "2025-12-30T10:00:00Z",
  "updated_at": "2025-12-30T10:00:00Z"
}
```

### Field Definitions

| Field        | Type      | Required | Constraints              | Description                  |
|--------------|-----------|----------|--------------------------|------------------------------|
| id           | integer   | auto     | Primary key              | Unique task identifier       |
| user_id      | string    | auto     | From JWT token           | Owner's user ID              |
| title        | string    | yes      | 1-200 characters         | Task title                   |
| description  | string    | no       | 0-1000 characters        | Optional description         |
| completed    | boolean   | auto     | Default: false           | Completion status            |
| created_at   | datetime  | auto     | ISO 8601 UTC             | Creation timestamp           |
| updated_at   | datetime  | auto     | ISO 8601 UTC             | Last modification timestamp  |

---

## Endpoints

### 1. List Tasks

Retrieve all tasks for the authenticated user.

**Request**

```
GET /api/tasks
```

**Query Parameters**

| Parameter | Type   | Required | Default   | Values                           |
|-----------|--------|----------|-----------|----------------------------------|
| status    | string | no       | `all`     | `all`, `pending`, `completed`    |
| sort      | string | no       | `created` | `created`, `title`               |

**Response: 200 OK**

```json
[
  {
    "id": 1,
    "user_id": "user_abc123",
    "title": "Buy groceries",
    "description": "Get milk and eggs",
    "completed": false,
    "created_at": "2025-12-30T10:00:00Z",
    "updated_at": "2025-12-30T10:00:00Z"
  }
]
```

**Errors**

| Status | Condition                |
|--------|--------------------------|
| 401    | Token missing or invalid |

---

### 2. Get Task by ID

Retrieve a specific task by its ID.

**Request**

```
GET /api/tasks/{id}
```

**Path Parameters**

| Parameter | Type    | Description         |
|-----------|---------|---------------------|
| id        | integer | Task ID to retrieve |

**Response: 200 OK**

```json
{
  "id": 1,
  "user_id": "user_abc123",
  "title": "Buy groceries",
  "description": "Get milk and eggs",
  "completed": false,
  "created_at": "2025-12-30T10:00:00Z",
  "updated_at": "2025-12-30T10:00:00Z"
}
```

**Errors**

| Status | Condition                      |
|--------|--------------------------------|
| 401    | Token invalid                  |
| 403    | Task belongs to different user |
| 404    | Task not found                 |

---

### 3. Create Task

Create a new task for the authenticated user.

**Request**

```
POST /api/tasks
Content-Type: application/json
```

**Request Body**

```json
{
  "title": "Buy groceries",
  "description": "Get milk and eggs"
}
```

| Field       | Type   | Required | Constraints        |
|-------------|--------|----------|--------------------|
| title       | string | yes      | 1-200 characters   |
| description | string | no       | 0-1000 characters  |

**Response: 201 Created**

```json
{
  "id": 1,
  "user_id": "user_abc123",
  "title": "Buy groceries",
  "description": "Get milk and eggs",
  "completed": false,
  "created_at": "2025-12-30T10:00:00Z",
  "updated_at": "2025-12-30T10:00:00Z"
}
```

**Errors**

| Status | Condition                              |
|--------|----------------------------------------|
| 401    | Token invalid                          |
| 422    | Validation failed (title missing, etc) |

---

### 4. Update Task

Update an existing task's details.

**Request**

```
PUT /api/tasks/{id}
Content-Type: application/json
```

**Path Parameters**

| Parameter | Type    | Description       |
|-----------|---------|-------------------|
| id        | integer | Task ID to update |

**Request Body**

```json
{
  "title": "Buy groceries and fruits",
  "description": "Updated description"
}
```

| Field       | Type   | Required | Constraints        |
|-------------|--------|----------|--------------------|
| title       | string | no       | 1-200 characters   |
| description | string | no       | 0-1000 characters  |

**Note**: At least one field must be provided.

**Response: 200 OK**

```json
{
  "id": 1,
  "user_id": "user_abc123",
  "title": "Buy groceries and fruits",
  "description": "Updated description",
  "completed": false,
  "created_at": "2025-12-30T10:00:00Z",
  "updated_at": "2025-12-30T10:15:00Z"
}
```

**Errors**

| Status | Condition                      |
|--------|--------------------------------|
| 401    | Token invalid                  |
| 403    | Task belongs to different user |
| 404    | Task not found                 |
| 422    | Validation failed              |

---

### 5. Delete Task

Delete a task (soft delete - data preserved).

**Request**

```
DELETE /api/tasks/{id}
```

**Path Parameters**

| Parameter | Type    | Description       |
|-----------|---------|-------------------|
| id        | integer | Task ID to delete |

**Response: 204 No Content**

No response body.

**Errors**

| Status | Condition                      |
|--------|--------------------------------|
| 401    | Token invalid                  |
| 403    | Task belongs to different user |
| 404    | Task not found                 |

---

### 6. Toggle Task Completion

Toggle the completion status of a task.

**Request**

```
PATCH /api/tasks/{id}/complete
```

**Path Parameters**

| Parameter | Type    | Description              |
|-----------|---------|--------------------------|
| id        | integer | Task ID to toggle status |

**Response: 200 OK**

```json
{
  "id": 1,
  "user_id": "user_abc123",
  "title": "Buy groceries",
  "description": "Get milk and eggs",
  "completed": true,
  "created_at": "2025-12-30T10:00:00Z",
  "updated_at": "2025-12-30T10:20:00Z"
}
```

**Errors**

| Status | Condition                      |
|--------|--------------------------------|
| 401    | Token invalid                  |
| 403    | Task belongs to different user |
| 404    | Task not found                 |

---

## Security Considerations

1. **User ID Extraction**: User ID is ALWAYS extracted from the JWT token, never from request body or URL parameters
2. **Data Isolation**: All endpoints automatically filter by the authenticated user's ID
3. **SQL Injection**: Prevented by using parameterized queries (ORM-provided)
4. **Soft Deletes**: Deleted tasks are marked with a `deleted_at` timestamp, never permanently removed
5. **Rate Limiting**: Recommended for production (future enhancement)

## Endpoint Summary

| Method | Path                      | Description              |
|--------|---------------------------|--------------------------|
| GET    | /api/tasks                | List all user's tasks    |
| GET    | /api/tasks/{id}           | Get specific task        |
| POST   | /api/tasks                | Create new task          |
| PUT    | /api/tasks/{id}           | Update task details      |
| DELETE | /api/tasks/{id}           | Delete task (soft)       |
| PATCH  | /api/tasks/{id}/complete  | Toggle completion status |

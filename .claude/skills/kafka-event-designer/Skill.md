---
name: kafka-event-designer
description: Design event schemas, topics, and producer/consumer patterns for event-driven architecture with Kafka + Dapr
---

# Kafka Event Designer Skill

## Purpose
Design event-driven architectures using Kafka for asynchronous communication, enabling loose coupling, scalability, and eventual consistency.

## Core Principles
1. **Events as Facts**: Events describe what happened, not commands
2. **Immutable Events**: Never modify published events
3. **Schema Evolution**: Design events to evolve without breaking consumers
4. **Idempotent Consumers**: Handle duplicate events gracefully
5. **At-Least-Once Delivery**: Events may be delivered multiple times

## When to Use
- Phase V: Event-driven features (recurring tasks, reminders)
- Decoupling microservices
- Asynchronous processing
- Event sourcing patterns
- Audit trails

## Event Design Pattern

### Event Structure
```json
{
  "event_id": "unique-uuid",
  "event_type": "task.created",
  "event_version": "1.0",
  "timestamp": "2025-12-30T10:00:00Z",
  "source": "todo-backend",
  "data": {
    "task_id": 123,
    "user_id": "user_abc",
    "title": "Buy groceries",
    "created_at": "2025-12-30T10:00:00Z"
  },
  "metadata": {
    "correlation_id": "req_xyz",
    "causation_id": "event_previous"
  }
}
```

### Required Fields (Every Event)
- `event_id`: Unique identifier (UUID) for deduplication
- `event_type`: Dot-separated name (e.g., `task.created`, `reminder.triggered`)
- `event_version`: Schema version for evolution
- `timestamp`: When event occurred (ISO 8601, UTC)
- `source`: Which service produced the event
- `data`: Event-specific payload

### Optional Fields
- `metadata.correlation_id`: Link related events (e.g., entire user session)
- `metadata.causation_id`: Event that caused this event
- `metadata.user_id`: Who triggered the event (for filtering)

## Todo App Event Catalog

### 1. Task Events
```yaml
# Event: task.created
event_type: task.created
version: "1.0"
description: "Published when a new task is created"
topic: task-events
schema:
  event_id: string (uuid)
  event_type: "task.created"
  event_version: "1.0"
  timestamp: string (ISO 8601)
  source: "todo-backend"
  data:
    task_id: integer
    user_id: string
    title: string
    description: string (nullable)
    created_at: string (ISO 8601)
  metadata:
    correlation_id: string

example:
  event_id: "550e8400-e29b-41d4-a716-446655440000"
  event_type: "task.created"
  event_version: "1.0"
  timestamp: "2025-12-30T10:00:00Z"
  source: "todo-backend"
  data:
    task_id: 123
    user_id: "user_abc"
    title: "Buy groceries"
    description: "Milk, eggs, bread"
    created_at: "2025-12-30T10:00:00Z"
  metadata:
    correlation_id: "req_xyz123"

consumers:
  - analytics-service (tracks task creation metrics)
  - notification-service (sends confirmation email)
```

```yaml
# Event: task.completed
event_type: task.completed
version: "1.0"
description: "Published when a task is marked complete"
topic: task-events
schema:
  data:
    task_id: integer
    user_id: string
    completed_at: string (ISO 8601)
    duration_seconds: integer (time from created to completed)

example:
  event_id: "660e8400-e29b-41d4-a716-446655440001"
  event_type: "task.completed"
  event_version: "1.0"
  timestamp: "2025-12-30T15:30:00Z"
  source: "todo-backend"
  data:
    task_id: 123
    user_id: "user_abc"
    completed_at: "2025-12-30T15:30:00Z"
    duration_seconds: 19800  # 5.5 hours

consumers:
  - analytics-service (completion rate metrics)
  - gamification-service (award points)
```

```yaml
# Event: task.deleted
event_type: task.deleted
version: "1.0"
description: "Published when a task is deleted (soft delete)"
topic: task-events
schema:
  data:
    task_id: integer
    user_id: string
    deleted_at: string (ISO 8601)
    reason: string (optional, e.g., "user_requested", "expired")

consumers:
  - audit-service (compliance logging)
```

### 2. Reminder Events
```yaml
# Event: reminder.triggered
event_type: reminder.triggered
version: "1.0"
description: "Published when a task reminder is due"
topic: reminder-events
schema:
  data:
    task_id: integer
    user_id: string
    due_date: string (ISO 8601)
    reminder_type: string (enum: "overdue", "due_soon", "recurring")

example:
  event_id: "770e8400-e29b-41d4-a716-446655440002"
  event_type: "reminder.triggered"
  event_version: "1.0"
  timestamp: "2025-12-31T09:00:00Z"
  source: "reminder-scheduler"
  data:
    task_id: 456
    user_id: "user_abc"
    due_date: "2025-12-31T10:00:00Z"
    reminder_type: "due_soon"

consumers:
  - notification-service (send email/SMS/push)
  - todo-backend (update task status if overdue)
```

### 3. User Activity Events
```yaml
# Event: user.logged_in
event_type: user.logged_in
version: "1.0"
description: "Published on successful authentication"
topic: user-events
schema:
  data:
    user_id: string
    login_method: string (enum: "email", "google", "github")
    ip_address: string
    user_agent: string

consumers:
  - analytics-service (track DAU/MAU)
  - security-service (detect suspicious logins)
```

## Kafka Topics Design
```yaml
topics:
  task-events:
    partitions: 3
    replication_factor: 2
    retention_ms: 604800000  # 7 days
    description: "All task-related events (created, updated, completed, deleted)"
    partition_key: user_id  # All events for same user go to same partition

  reminder-events:
    partitions: 3
    replication_factor: 2
    retention_ms: 86400000  # 1 day
    description: "Reminder triggers"
    partition_key: user_id

  user-events:
    partitions: 5
    replication_factor: 2
    retention_ms: 2592000000  # 30 days
    description: "User authentication and profile events"
    partition_key: user_id
```

## Producer Pattern (FastAPI + Dapr)
```python
# app/events/publisher.py
import httpx
import json
from datetime import datetime, timezone
from uuid import uuid4

DAPR_HTTP_PORT = 3500
DAPR_PUBSUB_NAME = "kafka-pubsub"

class EventPublisher:
    """Publish events to Kafka via Dapr"""

    @staticmethod
    async def publish_event(topic: str, event_type: str, data: dict, metadata: dict = None):
        """
        Publish event to Kafka topic via Dapr

        Args:
            topic: Kafka topic name
            event_type: Event type (e.g., "task.created")
            data: Event payload
            metadata: Optional metadata (correlation_id, etc.)
        """
        event = {
            "event_id": str(uuid4()),
            "event_type": event_type,
            "event_version": "1.0",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "source": "todo-backend",
            "data": data,
            "metadata": metadata or {}
        }

        # Publish via Dapr
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"http://localhost:{DAPR_HTTP_PORT}/v1.0/publish/{DAPR_PUBSUB_NAME}/{topic}",
                json=event
            )

            if response.status_code != 204:
                raise Exception(f"Failed to publish event: {response.text}")

        return event["event_id"]

# app/routes/tasks.py
from app.events.publisher import EventPublisher

@app.post("/api/{user_id}/tasks")
async def create_task(user_id: str, task: TaskCreate):
    # Create task in database
    new_task = Task(**task.dict(), user_id=user_id)
    db.add(new_task)
    db.commit()
    db.refresh(new_task)

    # Publish event
    await EventPublisher.publish_event(
        topic="task-events",
        event_type="task.created",
        data={
            "task_id": new_task.id,
            "user_id": new_task.user_id,
            "title": new_task.title,
            "description": new_task.description,
            "created_at": new_task.created_at.isoformat()
        },
        metadata={
            "correlation_id": request.state.request_id
        }
    )

    return new_task
```

## Consumer Pattern (Separate Service)
```python
# notification-service/consumer.py
from flask import Flask, request
import logging

app = Flask(__name__)
logger = logging.getLogger(__name__)

# Dapr will POST events to this endpoint
@app.route('/dapr/subscribe', methods=['GET'])
def subscribe():
    """Tell Dapr which topics to subscribe to"""
    subscriptions = [
        {
            "pubsubname": "kafka-pubsub",
            "topic": "task-events",
            "route": "/events/task"
        },
        {
            "pubsubname": "kafka-pubsub",
            "topic": "reminder-events",
            "route": "/events/reminder"
        }
    ]
    return subscriptions

@app.route('/events/task', methods=['POST'])
def handle_task_event():
    """Handle task events"""
    event = request.json

    logger.info(f"Received event: {event['event_type']}")

    # Idempotency check (store processed event_ids in database)
    if already_processed(event['event_id']):
        logger.info(f"Event {event['event_id']} already processed, skipping")
        return {'status': 'success'}, 200

    # Process based on event type
    if event['event_type'] == 'task.created':
        send_task_created_email(
            user_id=event['data']['user_id'],
            task_title=event['data']['title']
        )
    elif event['event_type'] == 'task.completed':
        send_task_completed_notification(
            user_id=event['data']['user_id'],
            task_id=event['data']['task_id']
        )

    # Mark as processed
    mark_processed(event['event_id'])

    return {'status': 'success'}, 200

def already_processed(event_id: str) -> bool:
    """Check if event was already processed (idempotency)"""
    # Query database for event_id
    return db.query(ProcessedEvent).filter_by(event_id=event_id).first() is not None

def mark_processed(event_id: str):
    """Mark event as processed"""
    db.add(ProcessedEvent(event_id=event_id))
    db.commit()
```

## Dapr Configuration
```yaml
# dapr/components/pubsub.kafka.yaml
apiVersion: dapr.io/v1alpha1
kind: Component
metadata:
  name: kafka-pubsub
spec:
  type: pubsub.kafka
  version: v1
  metadata:
    - name: brokers
      value: "kafka:9092"
    - name: authType
      value: "none"
    - name: consumerGroup
      value: "todo-app"
    - name: clientId
      value: "todo-backend"
```

## Idempotency Pattern

**Problem**: Kafka guarantees at-least-once delivery, so events may be delivered multiple times.

**Solution**: Track processed event_ids
```python
# models.py
class ProcessedEvent(SQLModel, table=True):
    event_id: str = Field(primary_key=True)
    processed_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    event_type: str
    consumer_name: str

# Idempotency decorator
def idempotent(func):
    async def wrapper(event, *args, **kwargs):
        event_id = event['event_id']

        # Check if already processed
        if db.query(ProcessedEvent).filter_by(event_id=event_id).first():
            logger.info(f"Event {event_id} already processed")
            return

        # Process event
        result = await func(event, *args, **kwargs)

        # Mark as processed
        db.add(ProcessedEvent(
            event_id=event_id,
            event_type=event['event_type'],
            consumer_name=func.__name__
        ))
        db.commit()

        return result
    return wrapper

# Usage
@idempotent
async def handle_task_created(event):
    # Process event
    send_email(...)
```

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| Events are commands ("CreateTask") | Events are facts ("task.created") |
| No event_id (can't deduplicate) | Always include unique event_id |
| No idempotency handling | Track processed events in database |
| Tight coupling (consumer knows producer) | Consumers only know event schema |
| No schema versioning | Include event_version field |

## Usage Instructions

### Design Event Schema
@.claude/skills/kafka-event-designer/Skill.md
Design event schema for "task updated" event.
Context: User can update task title, description, or due_date
Include:

Event type name
Schema (all fields)
Example payload
Consumers (who needs this event?)
Partition key

Save to: specs/events/task-updated.yml

### Generate Producer Code
@.claude/skills/kafka-event-designer/Skill.md
Generate Dapr event publisher for todo backend.
Events to publish:

task.created
task.completed
task.deleted
task.updated

Use Dapr HTTP API for pub/sub.
Save to: backend/app/events/publisher.py

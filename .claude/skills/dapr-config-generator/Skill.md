---
name: dapr-config-generator
description: Generate Dapr component configurations for pub/sub, state management, and scheduled jobs in event-driven architecture
---

# Dapr Config Generator Skill

## Purpose
Create Dapr component configurations that abstract infrastructure concerns, enabling portable event-driven applications across cloud providers and local development.

## Core Principles
1. **Infrastructure Abstraction**: Swap components without code changes
2. **Sidecar Pattern**: Dapr runs alongside application
3. **Building Blocks**: Pub/Sub, State, Bindings, Secrets, Jobs
4. **Multi-Cloud**: Same config works on Azure, AWS, GCP
5. **Local Development**: Use Docker Compose locally, K8s in production

## When to Use
- Phase V: Event-driven architecture
- Kafka integration
- Scheduled jobs (reminders)
- State management
- Secrets management

## Dapr Architecture
```
┌─────────────────────────────────────────┐
│         Your Application                │
│   (FastAPI, calls Dapr sidecar)        │
└─────────────────┬───────────────────────┘
                  │ HTTP/gRPC
                  ↓
┌─────────────────────────────────────────┐
│         Dapr Sidecar (daprd)           │
│   - Pub/Sub API                         │
│   - State API                           │
│   - Jobs API                            │
└─────────────────┬───────────────────────┘
                  │
        ┌─────────┴──────────┐
        ↓                    ↓
┌───────────────┐    ┌───────────────┐
│   Kafka       │    │  PostgreSQL   │
│   (Events)    │    │  (State)      │
└───────────────┘    └───────────────┘
```

## Component 1: Pub/Sub (Kafka)
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
    # Kafka brokers
    - name: brokers
      value: "kafka:9092"

    # Consumer group
    - name: consumerGroup
      value: "todo-app-group"

    # Client ID
    - name: clientId
      value: "todo-backend"

    # Authentication (none for local, SASL for prod)
    - name: authType
      value: "none"

    # For production with SASL:
    # - name: authType
    #   value: "password"
    # - name: saslUsername
    #   secretKeyRef:
    #     name: kafka-secrets
    #     key: username
    # - name: saslPassword
    #   secretKeyRef:
    #     name: kafka-secrets
    #     key: password
```

## Component 2: State Store (PostgreSQL)
```yaml
# dapr/components/state.postgresql.yaml
apiVersion: dapr.io/v1alpha1
kind: Component
metadata:
  name: statestore
spec:
  type: state.postgresql
  version: v1
  metadata:
    # Connection string
    - name: connectionString
      secretKeyRef:
        name: todo-secrets
        key: database-url

    # Table name for state
    - name: tableName
      value: "dapr_state"

    # Metadata table
    - name: metadataTableName
      value: "dapr_metadata"

    # Timeout
    - name: timeout
      value: "20"
```

## Component 3: Jobs (Scheduled Tasks)
```yaml
# dapr/components/jobs.yaml
apiVersion: dapr.io/v1alpha1
kind: Component
metadata:
  name: scheduler
spec:
  type: jobs.scheduler
  version: v1
  metadata:
    # Storage backend for job state
    - name: stateStore
      value: "statestore"
```

## Component 4: Secrets (Kubernetes)
```yaml
# dapr/components/secretstores.kubernetes.yaml
apiVersion: dapr.io/v1alpha1
kind: Component
metadata:
  name: kubernetes-secrets
spec:
  type: secretstores.kubernetes
  version: v1
  metadata:
    # No additional config needed for K8s secrets
```

## Publishing Events (Backend Code)
```python
# app/events/dapr_publisher.py
import httpx
import json
from datetime import datetime, timezone
from uuid import uuid4

DAPR_HTTP_PORT = 3500  # Dapr sidecar default port
PUBSUB_NAME = "kafka-pubsub"

class DaprEventPublisher:
    """Publish events to Kafka via Dapr"""

    @staticmethod
    async def publish(topic: str, event_type: str, data: dict):
        """
        Publish event to Kafka topic via Dapr pub/sub

        Args:
            topic: Kafka topic name (e.g., "task-events")
            event_type: Event type (e.g., "task.created")
            data: Event payload
        """
        event = {
            "event_id": str(uuid4()),
            "event_type": event_type,
            "event_version": "1.0",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "source": "todo-backend",
            "data": data
        }

        # Publish via Dapr HTTP API
        url = f"http://localhost:{DAPR_HTTP_PORT}/v1.0/publish/{PUBSUB_NAME}/{topic}"

        async with httpx.AsyncClient() as client:
            response = await client.post(url, json=event)

            if response.status_code != 204:
                raise Exception(f"Failed to publish event: {response.text}")

        return event["event_id"]

# Usage in route
from app.events.dapr_publisher import DaprEventPublisher

@app.post("/api/tasks")
async def create_task(task: TaskCreate, user_id: str = Depends(get_current_user)):
    # Create task
    new_task = Task(**task.dict(), user_id=user_id)
    db.add(new_task)
    db.commit()

    # Publish event
    await DaprEventPublisher.publish(
        topic="task-events",
        event_type="task.created",
        data={
            "task_id": new_task.id,
            "user_id": new_task.user_id,
            "title": new_task.title,
            "created_at": new_task.created_at.isoformat()
        }
    )

    return new_task
```

## Subscribing to Events (Consumer Service)
```python
# notification-service/app.py
from flask import Flask, request, jsonify
import logging

app = Flask(__name__)
logger = logging.getLogger(__name__)

# Tell Dapr which topics to subscribe to
@app.route('/dapr/subscribe', methods=['GET'])
def subscribe():
    """Dapr calls this endpoint to get subscription list"""
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
    return jsonify(subscriptions)

# Handle task events
@app.route('/events/task', methods=['POST'])
def handle_task_event():
    """Dapr POSTs events to this endpoint"""
    event = request.json

    logger.info(f"Received event: {event['event_type']}")

    # Process event
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

    # Return success
    return jsonify({"status": "success"}), 200

if __name__ == '__main__':
    app.run(port=5000)
```

## State Management (Dapr State API)
```python
# app/state/dapr_state.py
import httpx
import json

DAPR_HTTP_PORT = 3500
STATE_STORE_NAME = "statestore"

class DaprState:
    """Interact with Dapr state store"""

    @staticmethod
    async def save(key: str, value: dict):
        """Save state"""
        url = f"http://localhost:{DAPR_HTTP_PORT}/v1.0/state/{STATE_STORE_NAME}"

        state = [
            {
                "key": key,
                "value": value
            }
        ]

        async with httpx.AsyncClient() as client:
            response = await client.post(url, json=state)

            if response.status_code not in [200, 204]:
                raise Exception(f"Failed to save state: {response.text}")

    @staticmethod
    async def get(key: str):
        """Get state"""
        url = f"http://localhost:{DAPR_HTTP_PORT}/v1.0/state/{STATE_STORE_NAME}/{key}"

        async with httpx.AsyncClient() as client:
            response = await client.get(url)

            if response.status_code == 204:
                return None  # Key not found
            elif response.status_code == 200:
                return response.json()
            else:
                raise Exception(f"Failed to get state: {response.text}")

    @staticmethod
    async def delete(key: str):
        """Delete state"""
        url = f"http://localhost:{DAPR_HTTP_PORT}/v1.0/state/{STATE_STORE_NAME}/{key}"

        async with httpx.AsyncClient() as client:
            response = await client.delete(url)

            if response.status_code not in [200, 204]:
                raise Exception(f"Failed to delete state: {response.text}")

# Usage: Store processed event IDs (idempotency)
await DaprState.save(f"processed:{event_id}", {"processed_at": datetime.now().isoformat()})

# Check if event was processed
processed = await DaprState.get(f"processed:{event_id}")
if processed:
    logger.info("Event already processed, skipping")
    return
```

## Scheduled Jobs (Reminders)
```python
# app/jobs/reminder_scheduler.py
import httpx
from datetime import datetime, timezone

DAPR_HTTP_PORT = 3500

class ReminderScheduler:
    """Schedule reminders using Dapr Jobs API"""

    @staticmethod
    async def schedule_reminder(task_id: int, user_id: str, due_date: datetime):
        """
        Schedule a reminder job for a task

        Args:
            task_id: Task ID
            user_id: User ID
            due_date: When to trigger reminder
        """
        job_name = f"reminder-task-{task_id}"

        # Calculate schedule (ISO 8601 datetime for one-time job)
        schedule = due_date.isoformat()

        # Job payload
        job = {
            "data": {
                "task_id": task_id,
                "user_id": user_id,
                "reminder_type": "due_date"
            },
            "schedule": schedule,  # One-time job at exact time
            "repeats": 0,  # Don't repeat
            "dueTime": schedule
        }

        # Schedule via Dapr Jobs API
        url = f"http://localhost:{DAPR_HTTP_PORT}/v1.0-alpha1/jobs/{job_name}"

        async with httpx.AsyncClient() as client:
            response = await client.post(url, json=job)

            if response.status_code not in [200, 204]:
                raise Exception(f"Failed to schedule job: {response.text}")

        return job_name

# Endpoint that Dapr calls when job triggers
from fastapi import APIRouter

jobs_router = APIRouter()

@jobs_router.post("/jobs/reminder/{job_name}")
async def handle_reminder(job_name: str, payload: dict):
    """Dapr calls this when reminder job triggers"""
    task_id = payload["data"]["task_id"]
    user_id = payload["data"]["user_id"]

    # Publish reminder event
    await DaprEventPublisher.publish(
        topic="reminder-events",
        event_type="reminder.triggered",
        data={
            "task_id": task_id,
            "user_id": user_id,
            "triggered_at": datetime.now(timezone.utc).isoformat()
        }
    )

    return {"status": "success"}
```

## Kubernetes Deployment with Dapr
```yaml
# k8s/backend-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: todo-backend
  labels:
    app: todo-backend
spec:
  replicas: 2
  selector:
    matchLabels:
      app: todo-backend
  template:
    metadata:
      labels:
        app: todo-backend
      annotations:
        # Enable Dapr sidecar injection
        dapr.io/enabled: "true"
        dapr.io/app-id: "todo-backend"
        dapr.io/app-port: "8000"
        dapr.io/log-level: "info"
    spec:
      containers:
      - name: backend
        image: ghcr.io/yourusername/todo-backend:latest
        ports:
        - containerPort: 8000
        env:
        - name: DAPR_HTTP_PORT
          value: "3500"
        - name: DAPR_GRPC_PORT
          value: "50001"
```

## Docker Compose (Local Development)
```yaml
# docker-compose.dapr.yml
version: '3.8'

services:
  # Kafka
  kafka:
    image: confluentinc/cp-kafka:latest
    environment:
      KAFKA_BROKER_ID: 1
      KAFKA_ZOOKEEPER_CONNECT: zookeeper:2181
      KAFKA_ADVERTISED_LISTENERS: PLAINTEXT://kafka:9092
    ports:
      - "9092:9092"
    depends_on:
      - zookeeper

  zookeeper:
    image: confluentinc/cp-zookeeper:latest
    environment:
      ZOOKEEPER_CLIENT_PORT: 2181
    ports:
      - "2181:2181"

  # PostgreSQL
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: tododb
    ports:
      - "5432:5432"

  # Backend with Dapr sidecar
  backend:
    build: ./backend
    ports:
      - "8000:8000"
    environment:
      DAPR_HTTP_PORT: 3500
    depends_on:
      - kafka
      - postgres

  backend-dapr:
    image: "daprio/daprd:latest"
    command: [
      "./daprd",
      "-app-id", "todo-backend",
      "-app-port", "8000",
      "-dapr-http-port", "3500",
      "-components-path", "/components"
    ]
    volumes:
      - "./dapr/components:/components"
    network_mode: "service:backend"
    depends_on:
      - backend

  # Notification service with Dapr sidecar
  notification-service:
    build: ./notification-service
    ports:
      - "5000:5000"

  notification-dapr:
    image: "daprio/daprd:latest"
    command: [
      "./daprd",
      "-app-id", "notification-service",
      "-app-port", "5000",
      "-dapr-http-port", "3501",
      "-components-path", "/components"
    ]
    volumes:
      - "./dapr/components:/components"
    network_mode: "service:notification-service"
    depends_on:
      - notification-service
```

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| Calling Kafka directly | Use Dapr pub/sub API |
| No subscription endpoint | Implement /dapr/subscribe |
| Hardcoded Dapr port | Use DAPR_HTTP_PORT env var |
| Missing dapr.io/enabled annotation | Add to pod template |
| Component in wrong namespace | Match component namespace to app |
| Using cron for schedules | Use Dapr Jobs API for exact-time triggers |

## Usage Instructions

### Generate Dapr Components
@.claude/skills/dapr-config-generator/Skill.md
Generate Dapr component configurations for todo app.
Components needed:

Pub/Sub: Kafka for task events
State Store: PostgreSQL for state
Jobs: Scheduler for reminders
Secrets: Kubernetes secrets

Save to: dapr/components/

### Generate Event Publisher
@.claude/skills/dapr-config-generator/Skill.md
Generate Dapr event publisher for FastAPI backend.
Events to publish:

task.created
task.completed
task.deleted

Use Dapr HTTP API on port 3500.
Save to: backend/app/events/dapr_publisher.py

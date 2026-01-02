# Event-Driven Architecture Blueprint

Production-ready Kubernetes deployment for event-driven microservices with:
- **Kafka**: Message broker for event streaming
- **Dapr**: Distributed application runtime (pub/sub, state, jobs)
- **Multiple Consumers**: Independent services processing events
- **PostgreSQL**: State store for consumer idempotency

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           EVENT FLOW                                     │
└─────────────────────────────────────────────────────────────────────────┘

  ┌─────────────┐         ┌─────────────────────────────────┐
  │  Producer   │         │         KAFKA CLUSTER           │
  │  Service    │────────▶│  ┌─────┐  ┌─────┐  ┌─────┐     │
  │  (FastAPI)  │ publish │  │ P-0 │  │ P-1 │  │ P-2 │     │
  │ + Dapr      │         │  └──┬──┘  └──┬──┘  └──┬──┘     │
  └─────────────┘         │     │        │        │        │
                          │     └────────┼────────┘        │
                          │              │                 │
                          └──────────────┼─────────────────┘
                                         │
              ┌──────────────────────────┼──────────────────────────┐
              │                          │                          │
              ▼                          ▼                          ▼
    ┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐
    │ Task Processor  │      │  Notification   │      │    Analytics    │
    │    Consumer     │      │     Sender      │      │   Aggregator    │
    │   (x3 pods)     │      │   (x2 pods)     │      │   (x2 pods)     │
    │ + Dapr sidecar  │      │ + Dapr sidecar  │      │ + Dapr sidecar  │
    └────────┬────────┘      └────────┬────────┘      └────────┬────────┘
             │                        │                        │
             │        ┌───────────────┴────────────────┐       │
             │        │                                │       │
             ▼        ▼                                ▼       ▼
    ┌─────────────────────────────────────────────────────────────────┐
    │                        POSTGRESQL                                │
    │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
    │  │   dapr_state    │  │ processed_events│  │   aggregations  │  │
    │  │   (key-value)   │  │  (idempotency)  │  │   (analytics)   │  │
    │  └─────────────────┘  └─────────────────┘  └─────────────────┘  │
    └─────────────────────────────────────────────────────────────────┘
```

## Key Design Principles

### 1. Loose Coupling
- Producers don't know about consumers
- Events are the contract between services
- Add/remove consumers without producer changes

### 2. Events as Source of Truth
- CloudEvents-compliant event format
- Events are immutable facts
- Replay events to rebuild state

### 3. Idempotent Consumers
- Every event has unique `event_id`
- Consumers track processed events in PostgreSQL
- Safe to retry/replay events

### 4. Independent Scaling
- Each consumer scales independently
- KEDA scales based on Kafka lag
- No shared state between consumer instances

## Quick Start

### 1. Prerequisites

```bash
# Install Dapr
dapr init -k

# Verify Dapr
dapr status -k

# (Optional) Install KEDA for lag-based scaling
helm repo add kedacore https://kedacore.github.io/charts
helm install keda kedacore/keda -n keda --create-namespace
```

### 2. Create Namespace

```bash
kubectl create namespace event-driven
```

### 3. Deploy Secrets

```bash
# Edit secret.yaml with your values
vim k8s/secret.yaml
kubectl apply -f k8s/secret.yaml -n event-driven
```

### 4. Deploy Infrastructure

```bash
# Deploy Kafka and PostgreSQL
kubectl apply -f k8s/statefulset.yaml -n event-driven
kubectl apply -f k8s/service.yaml -n event-driven

# Wait for readiness
kubectl wait --for=condition=ready pod -l app=myapp-kafka -n event-driven --timeout=300s
kubectl wait --for=condition=ready pod -l app=myapp-postgresql -n event-driven --timeout=120s
```

### 5. Deploy Dapr Components

```bash
kubectl apply -f k8s/dapr-components/ -n event-driven
```

### 6. Deploy Services

```bash
kubectl apply -f k8s/configmap.yaml -n event-driven
kubectl apply -f k8s/deployment.yaml -n event-driven
kubectl apply -f k8s/hpa.yaml -n event-driven
```

### 7. Verify

```bash
kubectl get pods -n event-driven
kubectl get components -n event-driven  # Dapr components
kubectl logs -l app=myapp-producer -n event-driven -c daprd  # Dapr sidecar logs
```

## Adding New Topics

### 1. Create the Topic in Kafka

```bash
# Via Kafka CLI
kubectl exec -n event-driven myapp-kafka-0 -- kafka-topics.sh \
  --bootstrap-server localhost:9092 \
  --create --topic order-placed \
  --partitions 6 --replication-factor 3
```

### 2. Add Subscription in Dapr

```yaml
# k8s/dapr-components/pubsub.kafka.yaml
---
apiVersion: dapr.io/v2alpha1
kind: Subscription
metadata:
  name: order-placed-subscription
  namespace: event-driven
spec:
  pubsubname: kafka-pubsub
  topic: order-placed
  routes:
    default: /events/order-placed
  scopes:
    - order-processor  # Which app receives this
```

### 3. Implement Handler in Consumer

```python
# In your consumer app
@app.post("/events/order-placed")
async def handle_order_placed(event: CloudEvent):
    # Check idempotency
    if await is_processed(event.id):
        return {"status": "DUPLICATE"}

    # Process event
    await process_order(event.data)

    # Mark as processed
    await mark_processed(event.id)
    return {"status": "SUCCESS"}
```

## Adding New Consumers

### 1. Create Consumer Deployment

Add to `deployment.yaml`:

```yaml
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: myapp-order-processor
  namespace: event-driven
spec:
  replicas: 3
  template:
    metadata:
      annotations:
        dapr.io/enabled: "true"
        dapr.io/app-id: "order-processor"
        dapr.io/app-port: "8080"
    spec:
      containers:
      - name: order-processor
        image: your-registry/order-processor:latest
        ports:
        - containerPort: 8080
```

### 2. Add Subscription Scope

In `dapr-components/pubsub.kafka.yaml`, add your new app to relevant subscriptions:

```yaml
scopes:
  - existing-consumer
  - order-processor  # Add new consumer
```

### 3. Configure Autoscaling

Add KEDA ScaledObject for lag-based scaling:

```yaml
apiVersion: keda.sh/v1alpha1
kind: ScaledObject
metadata:
  name: myapp-order-processor-keda
spec:
  scaleTargetRef:
    name: myapp-order-processor
  minReplicaCount: 2
  maxReplicaCount: 20
  triggers:
  - type: kafka
    metadata:
      bootstrapServers: "myapp-kafka-headless:9092"
      consumerGroup: "order-processor"
      topic: "order-placed"
      lagThreshold: "100"
```

## Swapping Kafka for RabbitMQ

Dapr abstracts the message broker. To switch:

### 1. Deploy RabbitMQ

```bash
helm repo add bitnami https://charts.bitnami.com/bitnami
helm install rabbitmq bitnami/rabbitmq -n event-driven
```

### 2. Update Dapr Component

Replace `dapr-components/pubsub.kafka.yaml`:

```yaml
apiVersion: dapr.io/v1alpha1
kind: Component
metadata:
  name: kafka-pubsub  # Keep same name!
  namespace: event-driven
spec:
  type: pubsub.rabbitmq  # Change type
  version: v1
  metadata:
  - name: host
    value: "amqp://rabbitmq.event-driven.svc.cluster.local:5672"
  - name: durable
    value: "true"
  - name: deletedWhenUnused
    value: "false"
  - name: autoAck
    value: "false"
```

### 3. Apply and Restart

```bash
kubectl apply -f k8s/dapr-components/pubsub.kafka.yaml -n event-driven
kubectl rollout restart deployment -n event-driven
```

**No code changes required!** Your services use the same Dapr API.

## Monitoring

### Prometheus Metrics

Key metrics to monitor:

| Metric | Description | Alert Threshold |
|--------|-------------|-----------------|
| `kafka_consumer_lag` | Messages waiting | > 1000 for 5min |
| `dapr_pubsub_ingress_count` | Events received | Sudden drop |
| `dapr_pubsub_error_count` | Publish/subscribe errors | > 0 |
| `event_processing_duration_seconds` | Processing time | p95 > 10s |
| `dead_letter_events_total` | Failed events | Any increase |

### Grafana Dashboards

Import these dashboards:
- **Kafka Overview**: Cluster health, topic throughput
- **Consumer Lag**: Per-topic, per-consumer lag
- **Dapr Metrics**: Component health, request rates

### Alerting Rules

```yaml
# prometheus-rules.yaml
groups:
- name: event-driven-alerts
  rules:
  - alert: HighConsumerLag
    expr: kafka_consumer_lag > 1000
    for: 5m
    labels:
      severity: warning
    annotations:
      summary: "Kafka consumer lag is high"

  - alert: DeadLetterEvents
    expr: increase(dead_letter_events_total[5m]) > 0
    labels:
      severity: critical
    annotations:
      summary: "Events being sent to dead letter queue"
```

## Event Schema (CloudEvents)

All events follow CloudEvents 1.0 specification:

```json
{
  "specversion": "1.0",
  "type": "com.myapp.task.created",
  "source": "/producer-service",
  "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "time": "2024-01-15T10:30:00Z",
  "datacontenttype": "application/json",
  "data": {
    "task_id": 123,
    "user_id": "user-456",
    "title": "Complete documentation",
    "created_at": "2024-01-15T10:30:00Z"
  }
}
```

## Troubleshooting

### Events Not Being Delivered

```bash
# Check Dapr sidecar logs
kubectl logs <pod-name> -c daprd -n event-driven

# Check if pubsub component is loaded
kubectl get components -n event-driven

# Verify subscription
kubectl get subscriptions -n event-driven
```

### Consumer Lag Growing

```bash
# Check consumer group status
kubectl exec -n event-driven myapp-kafka-0 -- kafka-consumer-groups.sh \
  --bootstrap-server localhost:9092 \
  --describe --group task-processor

# Scale up consumers
kubectl scale deployment myapp-task-processor --replicas=10 -n event-driven
```

### Dead Letter Events

```bash
# Check dead letter topic
kubectl exec -n event-driven myapp-kafka-0 -- kafka-console-consumer.sh \
  --bootstrap-server localhost:9092 \
  --topic dead-letter \
  --from-beginning

# Manually replay failed events
# (implement a dead letter processor service)
```

## Cost Optimization

1. **Use KEDA**: Scale to zero when no events (instead of minimum replicas)
2. **Right-size Kafka**: Match partition count to consumer count
3. **Compress Events**: Enable Kafka compression for large events
4. **Retention Policy**: Set appropriate log retention (7 days default)
5. **Spot Instances**: Run consumers on spot/preemptible nodes

## Security Checklist

- [ ] Kafka SASL/TLS enabled for broker communication
- [ ] Network policies restricting pod-to-pod traffic
- [ ] Secrets in External Secrets / Vault (not in git)
- [ ] Event schema validation enabled
- [ ] Pod security policies (non-root, read-only filesystem)
- [ ] mTLS between services via Dapr
- [ ] Rate limiting on producer endpoints
- [ ] Audit logging for event publishing

---
name: monitoring-setup
description: Set up observability stack with Prometheus, Grafana, and structured logging for Phase V
---

# Monitoring Setup Skill

## Purpose
Implement comprehensive observability to track application health, performance, and identify issues before they impact users.

## Core Principles
1. **Four Golden Signals**: Latency, Traffic, Errors, Saturation
2. **Observability Triad**: Metrics, Logs, Traces
3. **Alert on Symptoms, Not Causes**: Alert when users are affected
4. **SLO-Based Alerting**: Define Service Level Objectives
5. **Dashboards for Debugging**: Not just pretty graphs

## When to Use
- Phase V: Cloud deployment
- Production monitoring
- Performance optimization
- Incident response preparation

## Observability Stack
```
┌─────────────────────────────────────────┐
│         Application Layer               │
│  (FastAPI, Next.js, MCP Server)        │
│  - Emit metrics to Prometheus          │
│  - Write structured JSON logs          │
│  - Send traces to Jaeger               │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│         Collection Layer                │
│  - Prometheus (metrics scraping)       │
│  - Loki (log aggregation)              │
│  - Jaeger (trace collection)           │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│         Visualization Layer             │
│  - Grafana (dashboards + alerts)       │
└─────────────────────────────────────────┘
```

## Prometheus Metrics (Backend)

### Instrument FastAPI Application
```python
# app/monitoring.py
from prometheus_client import Counter, Histogram, Gauge, generate_latest
from prometheus_client import CONTENT_TYPE_LATEST
from fastapi import Response
import time

# Define metrics
http_requests_total = Counter(
    'http_requests_total',
    'Total HTTP requests',
    ['method', 'endpoint', 'status']
)

http_request_duration_seconds = Histogram(
    'http_request_duration_seconds',
    'HTTP request latency',
    ['method', 'endpoint'],
    buckets=[0.01, 0.05, 0.1, 0.5, 1.0, 2.0, 5.0]
)

tasks_created_total = Counter(
    'tasks_created_total',
    'Total tasks created',
    ['user_id']
)

tasks_completed_total = Counter(
    'tasks_completed_total',
    'Total tasks marked complete',
    ['user_id']
)

active_tasks_gauge = Gauge(
    'active_tasks',
    'Current number of pending tasks',
    ['user_id']
)

database_connection_pool = Gauge(
    'database_connection_pool_size',
    'Database connection pool size',
    ['state']  # 'idle' or 'active'
)

# Middleware to track requests
from starlette.middleware.base import BaseHTTPMiddleware

class MetricsMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request, call_next):
        start_time = time.time()

        # Process request
        response = await call_next(request)

        # Record metrics
        duration = time.time() - start_time

        http_requests_total.labels(
            method=request.method,
            endpoint=request.url.path,
            status=response.status_code
        ).inc()

        http_request_duration_seconds.labels(
            method=request.method,
            endpoint=request.url.path
        ).observe(duration)

        return response

# Metrics endpoint
from fastapi import APIRouter

metrics_router = APIRouter()

@metrics_router.get("/metrics")
async def metrics():
    """Prometheus scrape endpoint"""
    return Response(
        content=generate_latest(),
        media_type=CONTENT_TYPE_LATEST
    )
```

### Add to main.py
```python
# app/main.py
from fastapi import FastAPI
from app.monitoring import MetricsMiddleware, metrics_router

app = FastAPI()

# Add metrics middleware
app.add_middleware(MetricsMiddleware)

# Add metrics endpoint
app.include_router(metrics_router)
```

### Track Business Metrics
```python
# app/routes/tasks.py
from app.monitoring import tasks_created_total, active_tasks_gauge

@app.post("/api/{user_id}/tasks")
async def create_task(user_id: str, task: TaskCreate):
    # Create task in database
    new_task = Task(**task.dict(), user_id=user_id)
    db.add(new_task)
    db.commit()

    # Record metric
    tasks_created_total.labels(user_id=user_id).inc()

    # Update gauge
    pending_count = db.query(Task).filter(
        Task.user_id == user_id,
        Task.completed == False
    ).count()
    active_tasks_gauge.labels(user_id=user_id).set(pending_count)

    return new_task
```

## Prometheus Configuration
```yaml
# prometheus/prometheus.yml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  # Scrape FastAPI backend
  - job_name: 'backend'
    static_configs:
      - targets: ['backend-service:8000']
    metrics_path: '/metrics'

  # Scrape Kubernetes pods with annotation
  - job_name: 'kubernetes-pods'
    kubernetes_sd_configs:
      - role: pod
    relabel_configs:
      - source_labels: [__meta_kubernetes_pod_annotation_prometheus_io_scrape]
        action: keep
        regex: true
      - source_labels: [__meta_kubernetes_pod_annotation_prometheus_io_path]
        action: replace
        target_label: __metrics_path__
        regex: (.+)
      - source_labels: [__address__, __meta_kubernetes_pod_annotation_prometheus_io_port]
        action: replace
        regex: ([^:]+)(?::\d+)?;(\d+)
        replacement: $1:$2
        target_label: __address__

alerting:
  alertmanagers:
    - static_configs:
        - targets: ['alertmanager:9093']

rule_files:
  - '/etc/prometheus/alerts.yml'
```

## Alert Rules
```yaml
# prometheus/alerts.yml
groups:
  - name: application_alerts
    interval: 30s
    rules:
      # High error rate
      - alert: HighErrorRate
        expr: |
          rate(http_requests_total{status=~"5.."}[5m]) > 0.05
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "High error rate detected"
          description: "Error rate is {{ $value | humanizePercentage }} (threshold: 5%)"

      # Slow response time
      - alert: HighLatency
        expr: |
          histogram_quantile(0.95,
            rate(http_request_duration_seconds_bucket[5m])
          ) > 1.0
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High latency detected"
          description: "P95 latency is {{ $value }}s (threshold: 1s)"

      # Pod restarts
      - alert: PodRestartingFrequently
        expr: |
          rate(kube_pod_container_status_restarts_total[15m]) > 0.2
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Pod {{ $labels.pod }} restarting frequently"
          description: "Pod has restarted {{ $value }} times in 15 minutes"

      # Database connection pool exhaustion
      - alert: DatabaseConnectionPoolExhausted
        expr: |
          database_connection_pool_size{state="idle"} < 2
        for: 2m
        labels:
          severity: critical
        annotations:
          summary: "Database connection pool nearly exhausted"
          description: "Only {{ $value }} idle connections remaining"

      # High task creation rate (potential abuse)
      - alert: UnusualTaskCreationRate
        expr: |
          rate(tasks_created_total[5m]) > 10
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Unusual task creation rate for user {{ $labels.user_id }}"
          description: "Creating {{ $value }} tasks per second"
```

## Grafana Dashboards

### Application Performance Dashboard
```json
{
  "dashboard": {
    "title": "Todo App - Application Performance",
    "panels": [
      {
        "title": "Request Rate (req/s)",
        "targets": [{
          "expr": "sum(rate(http_requests_total[5m])) by (endpoint)"
        }],
        "type": "graph"
      },
      {
        "title": "Error Rate (%)",
        "targets": [{
          "expr": "sum(rate(http_requests_total{status=~'5..'}[5m])) / sum(rate(http_requests_total[5m])) * 100"
        }],
        "type": "graph",
        "alert": {
          "conditions": [
            {
              "evaluator": { "type": "gt", "params": [5] },
              "operator": { "type": "and" },
              "query": { "params": ["A", "5m", "now"] },
              "type": "query"
            }
          ]
        }
      },
      {
        "title": "Response Time (p50, p95, p99)",
        "targets": [
          {
            "expr": "histogram_quantile(0.50, sum(rate(http_request_duration_seconds_bucket[5m])) by (le))",
            "legendFormat": "p50"
          },
          {
            "expr": "histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket[5m])) by (le))",
            "legendFormat": "p95"
          },
          {
            "expr": "histogram_quantile(0.99, sum(rate(http_request_duration_seconds_bucket[5m])) by (le))",
            "legendFormat": "p99"
          }
        ],
        "type": "graph"
      },
      {
        "title": "Active Tasks by User",
        "targets": [{
          "expr": "topk(10, active_tasks)"
        }],
        "type": "graph"
      }
    ]
  }
}
```

### Business Metrics Dashboard
```json
{
  "dashboard": {
    "title": "Todo App - Business Metrics",
    "panels": [
      {
        "title": "Tasks Created (24h)",
        "targets": [{
          "expr": "increase(tasks_created_total[24h])"
        }],
        "type": "stat"
      },
      {
        "title": "Tasks Completed (24h)",
        "targets": [{
          "expr": "increase(tasks_completed_total[24h])"
        }],
        "type": "stat"
      },
      {
        "title": "Completion Rate (%)",
        "targets": [{
          "expr": "sum(increase(tasks_completed_total[24h])) / sum(increase(tasks_created_total[24h])) * 100"
        }],
        "type": "gauge"
      },
      {
        "title": "Active Users (7d)",
        "targets": [{
          "expr": "count(count_over_time(tasks_created_total[7d]))"
        }],
        "type": "stat"
      }
    ]
  }
}
```

## Structured Logging

### Backend Logging (FastAPI)
```python
# app/logging_config.py
import logging
import json
from datetime import datetime

class JSONFormatter(logging.Formatter):
    """Format logs as JSON for easy parsing"""

    def format(self, record):
        log_data = {
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
            "module": record.module,
            "function": record.funcName,
            "line": record.lineno
        }

        # Add exception info if present
        if record.exc_info:
            log_data["exception"] = self.formatException(record.exc_info)

        # Add extra fields
        if hasattr(record, 'user_id'):
            log_data["user_id"] = record.user_id
        if hasattr(record, 'request_id'):
            log_data["request_id"] = record.request_id

        return json.dumps(log_data)

# Configure logger
def setup_logging():
    logger = logging.getLogger()
    logger.setLevel(logging.INFO)

    handler = logging.StreamHandler()
    handler.setFormatter(JSONFormatter())
    logger.addHandler(handler)

    return logger
```

### Usage in Routes
```python
# app/routes/tasks.py
import logging

logger = logging.getLogger(__name__)

@app.post("/api/{user_id}/tasks")
async def create_task(user_id: str, task: TaskCreate):
    logger.info(
        "Creating task",
        extra={
            "user_id": user_id,
            "task_title": task.title,
            "request_id": request.state.request_id
        }
    )

    try:
        new_task = Task(**task.dict(), user_id=user_id)
        db.add(new_task)
        db.commit()

        logger.info(
            "Task created successfully",
            extra={
                "user_id": user_id,
                "task_id": new_task.id
            }
        )

        return new_task

    except Exception as e:
        logger.error(
            "Failed to create task",
            extra={
                "user_id": user_id,
                "error": str(e)
            },
            exc_info=True
        )
        raise
```

## Kubernetes Deployment (Monitoring Stack)
```yaml
# k8s/monitoring/prometheus-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: prometheus
  namespace: monitoring
spec:
  replicas: 1
  selector:
    matchLabels:
      app: prometheus
  template:
    metadata:
      labels:
        app: prometheus
    spec:
      containers:
      - name: prometheus
        image: prom/prometheus:v2.45.0
        ports:
        - containerPort: 9090
        volumeMounts:
        - name: config
          mountPath: /etc/prometheus
        - name: data
          mountPath: /prometheus
      volumes:
      - name: config
        configMap:
          name: prometheus-config
      - name: data
        persistentVolumeClaim:
          claimName: prometheus-data

---
apiVersion: v1
kind: Service
metadata:
  name: prometheus
  namespace: monitoring
spec:
  selector:
    app: prometheus
  ports:
  - port: 9090
    targetPort: 9090
  type: ClusterIP

---
# k8s/monitoring/grafana-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: grafana
  namespace: monitoring
spec:
  replicas: 1
  selector:
    matchLabels:
      app: grafana
  template:
    metadata:
      labels:
        app: grafana
    spec:
      containers:
      - name: grafana
        image: grafana/grafana:10.0.0
        ports:
        - containerPort: 3000
        env:
        - name: GF_SECURITY_ADMIN_PASSWORD
          valueFrom:
            secretKeyRef:
              name: grafana-secret
              key: admin-password
        volumeMounts:
        - name: data
          mountPath: /var/lib/grafana
      volumes:
      - name: data
        persistentVolumeClaim:
          claimName: grafana-data

---
apiVersion: v1
kind: Service
metadata:
  name: grafana
  namespace: monitoring
spec:
  selector:
    app: grafana
  ports:
  - port: 3000
    targetPort: 3000
  type: LoadBalancer
```

## Helm Installation (Easier Way)
```bash
# Add Prometheus community Helm repo
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo update

# Install kube-prometheus-stack (Prometheus + Grafana + Alertmanager)
helm install monitoring prometheus-community/kube-prometheus-stack \
  --namespace monitoring \
  --create-namespace \
  --set prometheus.prometheusSpec.serviceMonitorSelectorNilUsesHelmValues=false \
  --set grafana.adminPassword=admin123

# Access Grafana
kubectl port-forward -n monitoring svc/monitoring-grafana 3000:80

# Open: http://localhost:3000
# Username: admin
# Password: admin123
```

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| Too many alerts (alert fatigue) | Alert on user-impacting issues only |
| No runbooks for alerts | Every alert has "what to do" documentation |
| Metrics without labels | Add labels (user_id, endpoint, status) |
| Logging sensitive data | Sanitize logs (no passwords, tokens) |
| No retention policy | Set data retention (30d for metrics, 7d for logs) |

## Usage Instructions

### Set Up Monitoring for Backend
@.claude/skills/monitoring-setup/Skill.md
Set up Prometheus monitoring for FastAPI backend.
Metrics needed:

HTTP request rate, latency, errors
Business metrics (tasks created/completed)
Database connection pool
Active users

Include:

Prometheus instrumentation code
Metrics endpoint
Middleware for request tracking

Save to: backend/app/monitoring.py

### Create Grafana Dashboard
@.claude/skills/monitoring-setup/Skill.md
Create Grafana dashboard JSON for todo app.
Panels:

Request rate (line chart)
Error rate % (graph with alert)
P50/P95/P99 latency (multi-line)
Tasks created/completed (stat panels)
Active users (gauge)

Save to: k8s/monitoring/dashboards/app-performance.json

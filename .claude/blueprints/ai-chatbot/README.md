# AI Chatbot Kubernetes Blueprint

Production-ready Kubernetes deployment for AI chatbot applications with:
- **Frontend**: ChatKit UI (Next.js)
- **Backend**: FastAPI + OpenAI Agents SDK (stateless)
- **MCP Server**: Model Context Protocol for tool execution
- **PostgreSQL**: Persistent chat history storage

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                      INGRESS                            │
│  /        → Frontend                                    │
│  /api/*   → Backend                                     │
│  /ws/*    → Backend (WebSocket)                         │
└─────────────────────────────────────────────────────────┘
                          │
          ┌───────────────┼───────────────┐
          ▼               ▼               ▼
    ┌──────────┐    ┌──────────┐    ┌──────────┐
    │ Frontend │    │ Backend  │    │ Backend  │
    │  (x2)    │    │  (x3)    │    │  (x3)    │
    │ ChatKit  │    │ FastAPI  │    │ FastAPI  │
    └──────────┘    └────┬─────┘    └────┬─────┘
                         │               │
                         ▼               ▼
                   ┌──────────────────────────┐
                   │       MCP Server         │
                   │         (x2)             │
                   │   Tool Execution         │
                   └────────────┬─────────────┘
                                │
                                ▼
                   ┌──────────────────────────┐
                   │      PostgreSQL          │
                   │    (StatefulSet)         │
                   │   Chat History + Tasks   │
                   └──────────────────────────┘
```

## Key Design Principles

### 1. Stateless Backend
The backend is completely stateless:
- No session storage in memory
- Each request includes `conversation_id`
- Chat history loaded from database per request
- Any pod can handle any request

### 2. Persistent Chat History
All conversations stored in PostgreSQL:
- `conversations` table: Conversation metadata
- `messages` table: Full chat history (user, assistant, tool calls)
- Soft deletes for compliance

### 3. Separate MCP Server
MCP tools run in separate deployment:
- Independent scaling from chat backend
- Isolated failures (bad tool doesn't crash chat)
- Easy to add/remove tools

## Quick Start

### 1. Create Namespace

```bash
kubectl create namespace chatbot
```

### 2. Configure Secrets

**Option A: For Development** (edit secret.yaml directly)
```bash
# Edit secret.yaml with your values
vim k8s/secret.yaml
kubectl apply -f k8s/secret.yaml
```

**Option B: For Production** (use External Secrets)
```bash
# Store secrets in AWS Secrets Manager / GCP Secret Manager / Vault
# Then deploy External Secrets Operator
helm install external-secrets external-secrets/external-secrets
```

### 3. Deploy

```bash
# Apply all resources
kubectl apply -f k8s/ -n chatbot

# Or in order:
kubectl apply -f k8s/secret.yaml
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/statefulset.yaml  # PostgreSQL
kubectl apply -f k8s/service.yaml
kubectl apply -f k8s/deployment.yaml
kubectl apply -f k8s/ingress.yaml
kubectl apply -f k8s/hpa.yaml
```

### 4. Verify

```bash
kubectl get pods -n chatbot
kubectl get svc -n chatbot
kubectl get ingress -n chatbot
```

## Customization Guide

### Swap OpenAI for Different LLM

#### Option 1: Anthropic Claude
```yaml
# configmap.yaml
data:
  LLM_PROVIDER: "anthropic"
  ANTHROPIC_MODEL: "claude-3-opus-20240229"

# secret.yaml
stringData:
  ANTHROPIC_API_KEY: "sk-ant-..."
```

#### Option 2: Local LLM (Ollama)
```yaml
# Add Ollama deployment
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ollama
spec:
  template:
    spec:
      containers:
      - name: ollama
        image: ollama/ollama:latest
        resources:
          limits:
            nvidia.com/gpu: 1  # If using GPU

# configmap.yaml
data:
  LLM_PROVIDER: "local"
  LOCAL_LLM_URL: "http://ollama:11434"
  LOCAL_LLM_MODEL: "llama2"
```

#### Option 3: Azure OpenAI
```yaml
# configmap.yaml
data:
  LLM_PROVIDER: "azure"
  AZURE_OPENAI_ENDPOINT: "https://your-resource.openai.azure.com"
  AZURE_OPENAI_DEPLOYMENT: "gpt-4"
  AZURE_OPENAI_API_VERSION: "2024-02-15-preview"

# secret.yaml
stringData:
  AZURE_OPENAI_API_KEY: "your-azure-key"
```

### Change MCP Tools

Edit the `ENABLED_TOOLS` in configmap.yaml:

```yaml
ENABLED_TOOLS: |
  [
    {
      "name": "search_web",
      "description": "Search the web for information",
      "parameters": {
        "query": {"type": "string", "required": true}
      }
    },
    {
      "name": "send_email",
      "description": "Send an email",
      "parameters": {
        "to": {"type": "string", "required": true},
        "subject": {"type": "string", "required": true},
        "body": {"type": "string", "required": true}
      }
    }
  ]
```

### Add Vector Database (RAG)

For retrieval-augmented generation, add a vector database:

```yaml
# Add to deployment.yaml
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: qdrant
spec:
  template:
    spec:
      containers:
      - name: qdrant
        image: qdrant/qdrant:latest
        ports:
        - containerPort: 6333
        volumeMounts:
        - name: qdrant-data
          mountPath: /qdrant/storage

# Add service
---
apiVersion: v1
kind: Service
metadata:
  name: qdrant
spec:
  ports:
  - port: 6333
  selector:
    app: qdrant
```

Update backend config:
```yaml
# configmap.yaml
data:
  VECTOR_DB_URL: "http://qdrant:6333"
  ENABLE_RAG: "true"
```

### Use Managed Database (Neon/RDS)

Replace the StatefulSet with a connection to managed PostgreSQL:

```yaml
# secret.yaml - Use Neon connection string
stringData:
  DATABASE_URL: "postgresql://user:pass@ep-xxx.us-east-1.aws.neon.tech/chatbot?sslmode=require"
```

Then remove or disable the PostgreSQL StatefulSet:
```yaml
# values.yaml
postgres:
  enabled: false  # Don't deploy local PostgreSQL
```

## Environment Configurations

### Development (Minikube)

```yaml
# values-dev.yaml
app:
  environment: "development"

frontend:
  replicas: 1

backend:
  replicas: 1

mcpServer:
  replicas: 1

autoscaling:
  enabled: false

postgres:
  storage:
    storageClassName: "standard"  # Minikube default
```

### Production

```yaml
# values-prod.yaml
app:
  environment: "production"

frontend:
  replicas: 3
  image:
    pullPolicy: "Always"

backend:
  replicas: 5
  resources:
    limits:
      cpu: "2000m"
      memory: "4Gi"

mcpServer:
  replicas: 3

autoscaling:
  enabled: true
  backend:
    minReplicas: 3
    maxReplicas: 20

postgres:
  enabled: false  # Use managed DB
```

## Monitoring

### Add Prometheus Metrics

```yaml
# Add to backend deployment
metadata:
  annotations:
    prometheus.io/scrape: "true"
    prometheus.io/port: "8000"
    prometheus.io/path: "/metrics"
```

### Key Metrics to Monitor

- `chatbot_messages_total`: Total messages processed
- `chatbot_response_latency_seconds`: LLM response time
- `chatbot_tool_calls_total`: MCP tool invocations
- `chatbot_active_conversations`: Current active chats
- `chatbot_tokens_used_total`: Token consumption (cost tracking)

## Troubleshooting

### Pods Not Starting

```bash
kubectl describe pod -n chatbot <pod-name>
kubectl logs -n chatbot <pod-name>
```

### Database Connection Failed

```bash
# Check if PostgreSQL is ready
kubectl get pods -n chatbot -l app=chatbot-postgres

# Check database logs
kubectl logs -n chatbot chatbot-postgres-0

# Test connection from backend pod
kubectl exec -n chatbot -it <backend-pod> -- nc -zv chatbot-postgres 5432
```

### LLM API Errors

```bash
# Check backend logs for API errors
kubectl logs -n chatbot -l app=chatbot-backend

# Verify secret is mounted
kubectl exec -n chatbot -it <backend-pod> -- env | grep OPENAI
```

### MCP Tools Not Working

```bash
# Check MCP server logs
kubectl logs -n chatbot -l app=chatbot-mcp-server

# Test MCP server health
kubectl exec -n chatbot -it <backend-pod> -- curl http://chatbot-mcp-server:8001/health
```

## Cost Optimization

1. **Use Spot Instances**: Add node affinity for spot/preemptible nodes
2. **Right-size Resources**: Monitor actual usage and adjust limits
3. **Scale Down Off-Hours**: Use KEDA to scale to zero when idle
4. **Cache LLM Responses**: Add Redis for caching common queries
5. **Use Managed DB**: Neon's serverless PostgreSQL scales to zero

## Security Checklist

- [ ] Secrets in External Secrets / Vault (not in git)
- [ ] Network policies restricting pod-to-pod traffic
- [ ] Pod security policies (non-root, read-only filesystem)
- [ ] TLS everywhere (ingress, internal services)
- [ ] Rate limiting on API endpoints
- [ ] Input validation in MCP tools
- [ ] Audit logging for all chat interactions
- [ ] Regular secret rotation

# Basic Web App Kubernetes Blueprint

Reusable Kubernetes deployment template for any web application with:
- Frontend (Next.js, React, Vue, etc.)
- Backend (FastAPI, Node.js, Django, etc.)
- Database connection (PostgreSQL, MySQL, etc.)

## Quick Start

### 1. Copy Blueprint to Your Project

```bash
cp -r .claude/blueprints/basic-web-app/ k8s/
```

### 2. Customize values.yaml

Edit `k8s/values.yaml` with your specific settings:

```yaml
app:
  name: "my-app"          # Your app name
  namespace: "production"  # Target namespace

backend:
  image:
    repository: "ghcr.io/yourorg/backend"
    tag: "v1.0.0"

frontend:
  image:
    repository: "ghcr.io/yourorg/frontend"
    tag: "v1.0.0"

ingress:
  host: "myapp.example.com"
```

### 3. Replace Placeholders

Use sed or envsubst to replace `{{placeholders}}`:

```bash
# Using envsubst (recommended)
export APP_NAME="todo-app"
export NAMESPACE="production"
# ... set all variables

for file in k8s/*.yaml; do
  envsubst < "$file" > "$file.rendered"
done

# Or convert to Helm chart for proper templating
```

### 4. Deploy

```bash
# Create namespace
kubectl create namespace production

# Apply all resources
kubectl apply -f k8s/

# Or apply individually
kubectl apply -f k8s/secret.yaml
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/deployment.yaml
kubectl apply -f k8s/service.yaml
kubectl apply -f k8s/ingress.yaml
kubectl apply -f k8s/hpa.yaml
```

## File Overview

| File | Purpose |
|------|---------|
| `values.yaml` | All configurable parameters |
| `deployment.yaml` | Pod specs for frontend + backend |
| `service.yaml` | Network access (ClusterIP, LoadBalancer) |
| `ingress.yaml` | External HTTP routing with TLS |
| `configmap.yaml` | Non-sensitive environment variables |
| `secret.yaml` | Sensitive data (passwords, keys) |
| `hpa.yaml` | Autoscaling (2-10 replicas) |

## Deployment Configurations

### Local Development (Minikube)

```yaml
# values.yaml changes for Minikube
service:
  frontend:
    type: "NodePort"    # Not LoadBalancer

autoscaling:
  enabled: false        # No HPA needed locally

ingress:
  enabled: false        # Use NodePort directly
```

```bash
# Access via Minikube
minikube service my-app-frontend --url
```

### Staging Environment

```yaml
app:
  environment: "staging"

backend:
  replicas: 1
  resources:
    requests:
      cpu: "50m"
      memory: "64Mi"

autoscaling:
  enabled: false

ingress:
  host: "staging.myapp.example.com"
```

### Production Environment

```yaml
app:
  environment: "production"

backend:
  replicas: 3
  image:
    pullPolicy: "Always"
  resources:
    requests:
      cpu: "200m"
      memory: "256Mi"
    limits:
      cpu: "1000m"
      memory: "1Gi"

autoscaling:
  enabled: true
  minReplicas: 3
  maxReplicas: 20

ingress:
  host: "myapp.example.com"
  tls:
    enabled: true
```

## Common Operations

### View Deployment Status

```bash
kubectl get pods -l app=my-app-backend
kubectl get pods -l app=my-app-frontend
kubectl get hpa
kubectl get ingress
```

### View Logs

```bash
kubectl logs -l app=my-app-backend -f
kubectl logs -l app=my-app-frontend -f
```

### Scale Manually

```bash
kubectl scale deployment my-app-backend --replicas=5
```

### Update Image

```bash
kubectl set image deployment/my-app-backend backend=ghcr.io/org/backend:v2.0.0
```

### Rollback

```bash
kubectl rollout undo deployment/my-app-backend
kubectl rollout history deployment/my-app-backend
```

## Prerequisites

### Required

- Kubernetes cluster (Minikube, EKS, GKE, AKS)
- kubectl configured
- Docker images pushed to registry

### Optional (Production)

- NGINX Ingress Controller
- cert-manager (for TLS)
- Metrics Server (for HPA)
- External Secrets Operator (for secrets)

### Install NGINX Ingress (if needed)

```bash
# Minikube
minikube addons enable ingress

# Helm
helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx
helm install ingress-nginx ingress-nginx/ingress-nginx
```

### Install cert-manager (for TLS)

```bash
helm repo add jetstack https://charts.jetstack.io
helm install cert-manager jetstack/cert-manager \
  --namespace cert-manager \
  --create-namespace \
  --set installCRDs=true
```

### Install Metrics Server (for HPA)

```bash
# Minikube
minikube addons enable metrics-server

# Helm
helm repo add metrics-server https://kubernetes-sigs.github.io/metrics-server/
helm install metrics-server metrics-server/metrics-server
```

## Converting to Helm Chart

For production use, convert this blueprint to a proper Helm chart:

```bash
helm create my-app
# Copy templates to my-app/templates/
# Move values.yaml to my-app/values.yaml
# Use {{ .Values.* }} instead of {{placeholder}}
```

## Troubleshooting

### Pods Not Starting

```bash
kubectl describe pod <pod-name>
kubectl logs <pod-name> --previous
```

### Service Not Accessible

```bash
kubectl get svc
kubectl get endpoints
kubectl port-forward svc/my-app-frontend 3000:80
```

### Ingress Not Working

```bash
kubectl get ingress
kubectl describe ingress my-app-ingress
kubectl logs -n ingress-nginx -l app.kubernetes.io/component=controller
```

### HPA Not Scaling

```bash
kubectl get hpa
kubectl describe hpa my-app-backend-hpa
kubectl top pods  # Requires metrics-server
```

## Security Best Practices

1. **Never commit secrets** - Use External Secrets Operator or SOPS
2. **Run as non-root** - securityContext.runAsNonRoot: true
3. **Set resource limits** - Prevent noisy neighbor problems
4. **Enable network policies** - Restrict pod-to-pod traffic
5. **Use TLS everywhere** - cert-manager + Let's Encrypt
6. **Scan images** - Trivy, Snyk, or similar
7. **Rotate secrets** - Regular rotation policy

## Support

For issues specific to this blueprint:
1. Check values.yaml configuration
2. Verify placeholders are replaced
3. Check kubectl describe output
4. Review pod logs

---
name: helm-chart-builder
description: Generate Helm charts for Kubernetes deployment with parameterization, health checks, and autoscaling
---

# Helm Chart Builder Skill

## Purpose
Create production-ready Helm charts that enable easy deployment and configuration of applications across different Kubernetes environments.

## Core Principles
1. **Everything Parameterized**: No hardcoded values, use values.yaml
2. **Resource Limits Always**: Set CPU/memory requests and limits
3. **Health Probes Required**: Liveness and readiness on all pods
4. **HPA for Scaling**: Horizontal Pod Autoscaler for production
5. **Secrets Separate**: Never commit secrets, use Kubernetes Secrets

## When to Use
- Phase IV: Deploying to Kubernetes
- Multi-environment deployments (dev/staging/prod)
- Standardizing deployment configuration
- Enabling GitOps workflows

## Helm Chart Structure
```
helm/
└── todo-app/
    ├── Chart.yaml              # Chart metadata
    ├── values.yaml             # Default configuration
    ├── values-dev.yaml         # Dev environment overrides
    ├── values-prod.yaml        # Prod environment overrides
    └── templates/
        ├── deployment.yaml     # Pod spec
        ├── service.yaml        # Service definition
        ├── ingress.yaml        # Ingress rules
        ├── configmap.yaml      # Non-sensitive config
        ├── secret.yaml         # Sensitive data
        ├── hpa.yaml            # Autoscaling
        └── NOTES.txt           # Post-install instructions
```

## Chart.yaml
```yaml
# helm/todo-app/Chart.yaml
apiVersion: v2
name: todo-app
description: A Helm chart for Todo App (frontend + backend)
type: application
version: 1.0.0
appVersion: "1.0.0"
keywords:
  - todo
  - nextjs
  - fastapi
maintainers:
  - name: Your Name
    email: you@example.com
```

## values.yaml (Master Configuration)
```yaml
# helm/todo-app/values.yaml
# Default values for todo-app

# Global settings
global:
  environment: development
  domain: example.com

# Backend (FastAPI)
backend:
  enabled: true
  name: todo-backend

  image:
    repository: ghcr.io/yourusername/todo-backend
    tag: "latest"
    pullPolicy: IfNotPresent

  replicaCount: 2

  service:
    type: ClusterIP
    port: 8000
    targetPort: 8000

  resources:
    requests:
      cpu: 100m
      memory: 128Mi
    limits:
      cpu: 500m
      memory: 512Mi

  livenessProbe:
    httpGet:
      path: /health
      port: 8000
    initialDelaySeconds: 30
    periodSeconds: 10
    timeoutSeconds: 5
    failureThreshold: 3

  readinessProbe:
    httpGet:
      path: /health
      port: 8000
    initialDelaySeconds: 10
    periodSeconds: 5
    timeoutSeconds: 3
    failureThreshold: 3

  env:
    - name: ENVIRONMENT
      value: "production"
    - name: DATABASE_URL
      valueFrom:
        secretKeyRef:
          name: todo-secrets
          key: database-url
    - name: BETTER_AUTH_SECRET
      valueFrom:
        secretKeyRef:
          name: todo-secrets
          key: auth-secret

# Frontend (Next.js)
frontend:
  enabled: true
  name: todo-frontend

  image:
    repository: ghcr.io/yourusername/todo-frontend
    tag: "latest"
    pullPolicy: IfNotPresent

  replicaCount: 2

  service:
    type: LoadBalancer
    port: 80
    targetPort: 3000

  resources:
    requests:
      cpu: 100m
      memory: 256Mi
    limits:
      cpu: 500m
      memory: 512Mi

  livenessProbe:
    httpGet:
      path: /api/health
      port: 3000
    initialDelaySeconds: 30
    periodSeconds: 10

  readinessProbe:
    httpGet:
      path: /api/health
      port: 3000
    initialDelaySeconds: 10
    periodSeconds: 5

  env:
    - name: NEXT_PUBLIC_API_URL
      value: "http://todo-backend:8000"
    - name: NEXT_PUBLIC_APP_URL
      value: "https://{{ .Values.global.domain }}"

# Horizontal Pod Autoscaler
autoscaling:
  enabled: true
  minReplicas: 2
  maxReplicas: 10
  targetCPUUtilizationPercentage: 70
  targetMemoryUtilizationPercentage: 80

# Ingress
ingress:
  enabled: true
  className: nginx
  annotations:
    cert-manager.io/cluster-issuer: "letsencrypt-prod"
  hosts:
    - host: "{{ .Values.global.domain }}"
      paths:
        - path: /
          pathType: Prefix
          backend:
            service:
              name: todo-frontend
              port: 80
        - path: /api
          pathType: Prefix
          backend:
            service:
              name: todo-backend
              port: 8000
  tls:
    - secretName: todo-tls
      hosts:
        - "{{ .Values.global.domain }}"

# Secrets (base64 encoded values, or use external secret manager)
secrets:
  databaseUrl: "postgresql://user:pass@host/db"  # Will be base64 encoded
  authSecret: "your-secret-key-here"
```

## templates/deployment-backend.yaml
```yaml
# helm/todo-app/templates/deployment-backend.yaml
{{- if .Values.backend.enabled }}
apiVersion: apps/v1
kind: Deployment
metadata:
  name: {{ .Values.backend.name }}
  labels:
    app: {{ .Values.backend.name }}
    tier: backend
spec:
  replicas: {{ .Values.backend.replicaCount }}
  selector:
    matchLabels:
      app: {{ .Values.backend.name }}
  template:
    metadata:
      labels:
        app: {{ .Values.backend.name }}
        tier: backend
    spec:
      containers:
      - name: {{ .Values.backend.name }}
        image: "{{ .Values.backend.image.repository }}:{{ .Values.backend.image.tag }}"
        imagePullPolicy: {{ .Values.backend.image.pullPolicy }}
        ports:
        - name: http
          containerPort: {{ .Values.backend.service.targetPort }}
          protocol: TCP

        # Environment variables
        env:
        {{- range .Values.backend.env }}
        - name: {{ .name }}
          {{- if .value }}
          value: {{ .value | quote }}
          {{- else if .valueFrom }}
          valueFrom:
            {{- toYaml .valueFrom | nindent 12 }}
          {{- end }}
        {{- end }}

        # Resource limits
        resources:
          {{- toYaml .Values.backend.resources | nindent 10 }}

        # Liveness probe
        livenessProbe:
          {{- toYaml .Values.backend.livenessProbe | nindent 10 }}

        # Readiness probe
        readinessProbe:
          {{- toYaml .Values.backend.readinessProbe | nindent 10 }}
{{- end }}
```

## templates/deployment-frontend.yaml
```yaml
# helm/todo-app/templates/deployment-frontend.yaml
{{- if .Values.frontend.enabled }}
apiVersion: apps/v1
kind: Deployment
metadata:
  name: {{ .Values.frontend.name }}
  labels:
    app: {{ .Values.frontend.name }}
    tier: frontend
spec:
  replicas: {{ .Values.frontend.replicaCount }}
  selector:
    matchLabels:
      app: {{ .Values.frontend.name }}
  template:
    metadata:
      labels:
        app: {{ .Values.frontend.name }}
        tier: frontend
    spec:
      containers:
      - name: {{ .Values.frontend.name }}
        image: "{{ .Values.frontend.image.repository }}:{{ .Values.frontend.image.tag }}"
        imagePullPolicy: {{ .Values.frontend.image.pullPolicy }}
        ports:
        - name: http
          containerPort: {{ .Values.frontend.service.targetPort }}
          protocol: TCP

        env:
        {{- range .Values.frontend.env }}
        - name: {{ .name }}
          value: {{ .value | quote }}
        {{- end }}

        resources:
          {{- toYaml .Values.frontend.resources | nindent 10 }}

        livenessProbe:
          {{- toYaml .Values.frontend.livenessProbe | nindent 10 }}

        readinessProbe:
          {{- toYaml .Values.frontend.readinessProbe | nindent 10 }}
{{- end }}
```

## templates/service.yaml
```yaml
# helm/todo-app/templates/service-backend.yaml
{{- if .Values.backend.enabled }}
apiVersion: v1
kind: Service
metadata:
  name: {{ .Values.backend.name }}
  labels:
    app: {{ .Values.backend.name }}
spec:
  type: {{ .Values.backend.service.type }}
  ports:
    - port: {{ .Values.backend.service.port }}
      targetPort: {{ .Values.backend.service.targetPort }}
      protocol: TCP
      name: http
  selector:
    app: {{ .Values.backend.name }}
{{- end }}

---
# helm/todo-app/templates/service-frontend.yaml
{{- if .Values.frontend.enabled }}
apiVersion: v1
kind: Service
metadata:
  name: {{ .Values.frontend.name }}
  labels:
    app: {{ .Values.frontend.name }}
spec:
  type: {{ .Values.frontend.service.type }}
  ports:
    - port: {{ .Values.frontend.service.port }}
      targetPort: {{ .Values.frontend.service.targetPort }}
      protocol: TCP
      name: http
  selector:
    app: {{ .Values.frontend.name }}
{{- end }}
```

## templates/ingress.yaml
```yaml
# helm/todo-app/templates/ingress.yaml
{{- if .Values.ingress.enabled }}
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: todo-ingress
  annotations:
    {{- range $key, $value := .Values.ingress.annotations }}
    {{ $key }}: {{ $value | quote }}
    {{- end }}
spec:
  ingressClassName: {{ .Values.ingress.className }}
  tls:
  {{- range .Values.ingress.tls }}
    - hosts:
      {{- range .hosts }}
        - {{ . | quote }}
      {{- end }}
      secretName: {{ .secretName }}
  {{- end }}
  rules:
  {{- range .Values.ingress.hosts }}
    - host: {{ .host | quote }}
      http:
        paths:
        {{- range .paths }}
          - path: {{ .path }}
            pathType: {{ .pathType }}
            backend:
              service:
                name: {{ .backend.service.name }}
                port:
                  number: {{ .backend.service.port }}
        {{- end }}
  {{- end }}
{{- end }}
```

## templates/hpa.yaml
```yaml
# helm/todo-app/templates/hpa.yaml
{{- if .Values.autoscaling.enabled }}
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: {{ .Values.backend.name }}-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: {{ .Values.backend.name }}
  minReplicas: {{ .Values.autoscaling.minReplicas }}
  maxReplicas: {{ .Values.autoscaling.maxReplicas }}
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: {{ .Values.autoscaling.targetCPUUtilizationPercentage }}
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: {{ .Values.autoscaling.targetMemoryUtilizationPercentage }}

---
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: {{ .Values.frontend.name }}-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: {{ .Values.frontend.name }}
  minReplicas: {{ .Values.autoscaling.minReplicas }}
  maxReplicas: {{ .Values.autoscaling.maxReplicas }}
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: {{ .Values.autoscaling.targetCPUUtilizationPercentage }}
{{- end }}
```

## templates/secret.yaml
```yaml
# helm/todo-app/templates/secret.yaml
apiVersion: v1
kind: Secret
metadata:
  name: todo-secrets
type: Opaque
data:
  database-url: {{ .Values.secrets.databaseUrl | b64enc | quote }}
  auth-secret: {{ .Values.secrets.authSecret | b64enc | quote }}
```

## templates/NOTES.txt
```
Thank you for installing {{ .Chart.Name }}!

Your release is named {{ .Release.Name }}.

To access your application:
{{- if .Values.ingress.enabled }}

  Visit: https://{{ .Values.global.domain }}
{{- else }}

  Get the application URL by running:
  kubectl get svc --namespace {{ .Release.Namespace }} {{ .Values.frontend.name }}
{{- end }}

Monitor deployment:
  kubectl get pods --namespace {{ .Release.Namespace }} -l "app={{ .Values.backend.name }}"
  kubectl get pods --namespace {{ .Release.Namespace }} -l "app={{ .Values.frontend.name }}"

View logs:
  kubectl logs --namespace {{ .Release.Namespace }} -l "app={{ .Values.backend.name }}" -f
  kubectl logs --namespace {{ .Release.Namespace }} -l "app={{ .Values.frontend.name }}" -f

Check autoscaling:
  kubectl get hpa --namespace {{ .Release.Namespace }}
```

## values-dev.yaml (Development Overrides)
```yaml
# helm/todo-app/values-dev.yaml
global:
  environment: development
  domain: dev.todo.local

backend:
  replicaCount: 1
  image:
    tag: "dev"
  resources:
    requests:
      cpu: 50m
      memory: 64Mi
    limits:
      cpu: 200m
      memory: 256Mi

frontend:
  replicaCount: 1
  image:
    tag: "dev"
  resources:
    requests:
      cpu: 50m
      memory: 128Mi
    limits:
      cpu: 200m
      memory: 256Mi

autoscaling:
  enabled: false

ingress:
  enabled: false
```

## values-prod.yaml (Production Overrides)
```yaml
# helm/todo-app/values-prod.yaml
global:
  environment: production
  domain: todo.com

backend:
  replicaCount: 3
  image:
    tag: "v1.0.0"
    pullPolicy: Always
  resources:
    requests:
      cpu: 200m
      memory: 256Mi
    limits:
      cpu: 1000m
      memory: 1Gi

frontend:
  replicaCount: 3
  image:
    tag: "v1.0.0"
    pullPolicy: Always
  resources:
    requests:
      cpu: 200m
      memory: 512Mi
    limits:
      cpu: 1000m
      memory: 1Gi

autoscaling:
  enabled: true
  minReplicas: 3
  maxReplicas: 20

ingress:
  enabled: true
```

## Helm Commands

### Install
```bash
# Development
helm install todo-app ./helm/todo-app \
  -f helm/todo-app/values-dev.yaml \
  --namespace todo-dev \
  --create-namespace

# Production
helm install todo-app ./helm/todo-app \
  -f helm/todo-app/values-prod.yaml \
  --namespace todo-prod \
  --create-namespace
```

### Upgrade
```bash
helm upgrade todo-app ./helm/todo-app \
  -f helm/todo-app/values-prod.yaml \
  --namespace todo-prod
```

### Uninstall
```bash
helm uninstall todo-app --namespace todo-prod
```

### Lint
```bash
helm lint ./helm/todo-app
```

### Template (Dry Run)
```bash
helm template todo-app ./helm/todo-app \
  -f helm/todo-app/values-dev.yaml
```

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| Hardcoded values in templates | Use {{ .Values.* }} for everything |
| No resource limits | Always set requests and limits |
| No health probes | Add liveness and readiness probes |
| Secrets in values.yaml | Use Kubernetes Secrets or external secret manager |
| No HPA in production | Enable autoscaling for prod |
| Same config for all environments | Create values-dev.yaml, values-prod.yaml |

## Usage Instructions

### Generate Helm Chart
@.claude/skills/helm-chart-builder/Skill.md
Generate Helm chart for todo app (frontend + backend).
Requirements:

Backend (FastAPI) deployment with 2 replicas
Frontend (Next.js) deployment with 2 replicas
Services (ClusterIP for backend, LoadBalancer for frontend)
Ingress with NGINX
ConfigMaps for non-sensitive config
Secrets for DATABASE_URL and BETTER_AUTH_SECRET
HPA (2-10 replicas, CPU 70%)
Health probes on all pods

Save to: helm/todo-app/

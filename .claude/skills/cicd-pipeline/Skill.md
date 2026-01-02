---
name: cicd-pipeline
description: Generate GitHub Actions CI/CD workflows for automated testing, building, and deployment
---

# CI/CD Pipeline Skill

## Purpose
Create automated pipelines that test, build, and deploy code on every commit, ensuring code quality and enabling rapid deployment.

## Core Principles
1. **Fail Fast**: Run fastest tests first
2. **Parallel Execution**: Run independent jobs concurrently
3. **Cache Dependencies**: Speed up builds
4. **Secure Secrets**: Never commit credentials
5. **Manual Gates**: Require approval for production

## When to Use
- Setting up new repository
- Adding automated testing
- Enabling continuous deployment
- Phase IV-V (Docker + K8s deployments)

## Pipeline Stages
```
CI (Continuous Integration) - On Pull Request
├── Lint (Black, ESLint)
├── Type Check (mypy, tsc)
├── Unit Tests
├── Integration Tests
└── Coverage Check (80%+)

Build - On Main Push
├── Build Docker Images
├── Tag with commit SHA
└── Push to Registry

CD (Continuous Deployment) - On Main Push
├── Deploy to Staging (automatic)
├── Run Smoke Tests
├── Deploy to Production (manual approval)
└── Health Check
```

## Complete CI Workflow (Pull Requests)
```yaml
# .github/workflows/ci.yml
name: CI - Lint, Test, Coverage

on:
  pull_request:
    branches: [main, develop]

jobs:
  lint:
    name: Lint Code
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Set up Python
        uses: actions/setup-python@v5
        with:
          python-version: '3.13'
          cache: 'pip'

      - name: Install dependencies
        run: |
          pip install black mypy ruff
          pip install -r backend/requirements.txt

      - name: Run Black (formatter check)
        run: black --check backend/

      - name: Run Ruff (linter)
        run: ruff check backend/

      - name: Run mypy (type checker)
        run: mypy backend/

  lint-frontend:
    name: Lint Frontend
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Set up Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: frontend/package-lock.json

      - name: Install dependencies
        working-directory: frontend
        run: npm ci

      - name: Run ESLint
        working-directory: frontend
        run: npm run lint

      - name: Run TypeScript check
        working-directory: frontend
        run: npm run type-check

  test-backend:
    name: Test Backend
    runs-on: ubuntu-latest
    needs: lint  # Run after lint passes

    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_PASSWORD: test_password
          POSTGRES_DB: test_db
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Set up Python
        uses: actions/setup-python@v5
        with:
          python-version: '3.13'
          cache: 'pip'

      - name: Install dependencies
        run: |
          pip install pytest pytest-cov pytest-asyncio
          pip install -r backend/requirements.txt

      - name: Run tests with coverage
        working-directory: backend
        env:
          DATABASE_URL: postgresql://postgres:test_password@localhost:5432/test_db
        run: |
          pytest tests/ \
            --cov=app \
            --cov-report=xml \
            --cov-report=term-missing \
            --cov-fail-under=80

      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v4
        with:
          files: backend/coverage.xml
          flags: backend

  test-frontend:
    name: Test Frontend
    runs-on: ubuntu-latest
    needs: lint-frontend

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Set up Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: frontend/package-lock.json

      - name: Install dependencies
        working-directory: frontend
        run: npm ci

      - name: Run tests
        working-directory: frontend
        run: npm test -- --coverage --watchAll=false

      - name: Upload coverage
        uses: codecov/codecov-action@v4
        with:
          files: frontend/coverage/coverage-final.json
          flags: frontend

  security-scan:
    name: Security Scan
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Run Trivy vulnerability scanner
        uses: aquasecurity/trivy-action@master
        with:
          scan-type: 'fs'
          scan-ref: '.'
          format: 'sarif'
          output: 'trivy-results.sarif'

      - name: Upload Trivy results to GitHub Security
        uses: github/codeql-action/upload-sarif@v3
        with:
          sarif_file: 'trivy-results.sarif'
```

## Complete CD Workflow (Main Push)
```yaml
# .github/workflows/cd.yml
name: CD - Build and Deploy

on:
  push:
    branches: [main]

env:
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}

jobs:
  build:
    name: Build Docker Images
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write

    outputs:
      image_tag: ${{ steps.meta.outputs.tags }}

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Log in to GitHub Container Registry
        uses: docker/login-action@v3
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Extract metadata (tags, labels)
        id: meta
        uses: docker/metadata-action@v5
        with:
          images: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}
          tags: |
            type=sha,prefix=,format=short
            type=ref,event=branch
            type=raw,value=latest,enable={{is_default_branch}}

      - name: Build and push backend image
        uses: docker/build-push-action@v5
        with:
          context: ./backend
          push: true
          tags: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}-backend:${{ github.sha }}
          labels: ${{ steps.meta.outputs.labels }}
          cache-from: type=gha
          cache-to: type=gha,mode=max

      - name: Build and push frontend image
        uses: docker/build-push-action@v5
        with:
          context: ./frontend
          push: true
          tags: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}-frontend:${{ github.sha }}
          labels: ${{ steps.meta.outputs.labels }}
          cache-from: type=gha
          cache-to: type=gha,mode=max

  deploy-staging:
    name: Deploy to Staging
    runs-on: ubuntu-latest
    needs: build
    environment:
      name: staging
      url: https://staging.example.com

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Set up kubectl
        uses: azure/setup-kubectl@v3

      - name: Configure kubeconfig
        run: |
          echo "${{ secrets.KUBECONFIG_STAGING }}" | base64 -d > kubeconfig
          export KUBECONFIG=kubeconfig

      - name: Deploy with Helm
        run: |
          helm upgrade --install todo-app ./helm/todo-app \
            --namespace staging \
            --create-namespace \
            --set backend.image.tag=${{ github.sha }} \
            --set frontend.image.tag=${{ github.sha }} \
            --set ingress.host=staging.example.com \
            --wait --timeout=5m

      - name: Run smoke tests
        run: |
          sleep 30  # Wait for pods to be ready
          curl -f https://staging.example.com/health || exit 1

  deploy-production:
    name: Deploy to Production
    runs-on: ubuntu-latest
    needs: [build, deploy-staging]
    environment:
      name: production
      url: https://example.com

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Set up kubectl
        uses: azure/setup-kubectl@v3

      - name: Configure kubeconfig
        run: |
          echo "${{ secrets.KUBECONFIG_PRODUCTION }}" | base64 -d > kubeconfig
          export KUBECONFIG=kubeconfig

      - name: Deploy with Helm
        run: |
          helm upgrade --install todo-app ./helm/todo-app \
            --namespace production \
            --create-namespace \
            --set backend.image.tag=${{ github.sha }} \
            --set frontend.image.tag=${{ github.sha }} \
            --set ingress.host=example.com \
            --wait --timeout=10m

      - name: Run smoke tests
        run: |
          sleep 30
          curl -f https://example.com/health || exit 1

      - name: Notify deployment
        uses: 8398a7/action-slack@v3
        with:
          status: ${{ job.status }}
          text: 'Deployed ${{ github.sha }} to production'
          webhook_url: ${{ secrets.SLACK_WEBHOOK }}
        if: always()
```

## Matrix Builds (Test Multiple Versions)
```yaml
test-matrix:
  name: Test on Multiple Versions
  runs-on: ${{ matrix.os }}

  strategy:
    matrix:
      os: [ubuntu-latest, macos-latest]
      python-version: ['3.12', '3.13']
      node-version: ['18', '20']

  steps:
    - uses: actions/checkout@v4

    - name: Set up Python ${{ matrix.python-version }}
      uses: actions/setup-python@v5
      with:
        python-version: ${{ matrix.python-version }}

    - name: Set up Node ${{ matrix.node-version }}
      uses: actions/setup-node@v4
      with:
        node-version: ${{ matrix.node-version }}

    - name: Run tests
      run: make test
```

## Secrets Management

### GitHub Secrets Needed
- `KUBECONFIG_STAGING`: base64-encoded kubeconfig for staging cluster
- `KUBECONFIG_PRODUCTION`: base64-encoded kubeconfig for prod cluster
- `DOCKER_USERNAME`: Docker Hub username (if using Docker Hub)
- `DOCKER_PASSWORD`: Docker Hub token
- `SLACK_WEBHOOK`: Slack webhook URL for notifications
- `CODECOV_TOKEN`: Codecov upload token

### Setting Secrets
```bash
# Encode kubeconfig
cat ~/.kube/config | base64

# Add to GitHub:
# Settings → Secrets and variables → Actions → New repository secret
```

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| Secrets in code | Use GitHub Secrets |
| No caching | Cache pip/npm dependencies |
| Sequential jobs | Run jobs in parallel with `needs` |
| No manual approval for prod | Use `environment` with protection rules |
| Long-running tests in CI | Mock external services, use test database |

## Usage Instructions

### Generate CI Workflow
@.claude/skills/cicd-pipeline/Skill.md
Generate GitHub Actions CI workflow for todo app.
Requirements:

Lint: Black, Ruff, ESLint
Test: pytest (backend), Jest (frontend)
Coverage: 80% minimum
Matrix: Python 3.12-3.13, Node 18-20
PostgreSQL service for integration tests

Save to: .github/workflows/ci.yml

### Generate CD Workflow
@.claude/skills/cicd-pipeline/Skill.md
Generate GitHub Actions CD workflow for K8s deployment.
Stages:

Build Docker images (backend + frontend)
Push to GitHub Container Registry
Deploy to staging (automatic)
Run smoke tests
Deploy to production (manual approval)

Use Helm for deployments.
Save to: .github/workflows/cd.yml

---
title: "DEPLOYMENT STRATEGY - DDD Design"
description: "Detailed design document for the DEPLOYMENT STRATEGY component of the FlexIA system, following Domain-Driven Design principles."
keywords: ["ddd", "design", "architecture", "deployment-strategy", "specification"]
category: "Reports"
last_updated: "2026-02-13"
---
# Deployment Strategy

## 1. Containerization Strategy

### 1.1 Docker Images
- **Router Service (`ai-router-service`)**:
  - Base Image: `node:18-alpine`
  - Optimization: Multi-stage build to keep image small (<100MB).
  - Entrypoint: `npm start`
  - Env Vars:
    - `CENTRAL_API_URL`: URL of the Central System.
    - `INVITE_TOKEN`: (Optional) Token for auto-registration.
    - `DATA_DIR`: Path to persist local DB (for resilience).
    - `PORT`: Default 3000.

- **Central System (`flexia-control-center`)**:
  - Existing Supabase stack (Postgres, GoTrue, PostgREST).
  - New Services (Registry, Ingestion) deployed as:
    - **Option A**: Supabase Edge Functions (easiest integration).
    - **Option B**: Separate container in `docker-compose.yml`.

## 2. Multi-Cloud Deployment Options

### 2.1 Google Cloud (Cloud Run) - Recommended
- **Pros**: Serverless, auto-scaling to zero, global load balancing.
- **Config**:
  - CPU: 1 vCPU
  - Memory: 512MB
  - Concurrency: 80
- **Command**:
  ```bash
  gcloud run deploy ai-router --image gcr.io/flexia/router:latest --set-env-vars CENTRAL_API_URL=...
  ```

### 2.2 AWS (App Runner / ECS Fargate)
- **Pros**: Integration with AWS ecosystem.
- **Config**:
  - Instance Role: minimal permissions.
  - VPC Interface Endpoints for security.

### 2.3 DigitalOcean (App Platform)
- **Pros**: Simple, flat pricing.
- **Config**:
  - Component: Web Service.
  - Size: Basic ($5/mo).

## 3. DevOps & CI/CD

### 3.1 Build Pipeline (GitHub Actions)
1. **Trigger**: Push to `main` or Tag.
2. **Build**: `docker build -t flexia/router:latest .`
3. **Test**: Run unit tests and integration tests.
4. **Push**: Push to ghcr.io or Docker Hub.
5. **Scanning**: Trivy scan for vulnerabilities.

### 3.2 Infrastructure as Code (IaC)
- **Terraform Modules**:
  - `modules/gcp-router`: Deploys Cloud Run service.
  - `modules/aws-router`: Deploys App Runner service.
- **Usage**:
  ```hcl
  module "router" {
    source = "./modules/gcp-router"
    central_api_url = var.central_api_url
    invite_token = var.invite_token
  }
  ```



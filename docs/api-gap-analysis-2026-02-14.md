# API Gap Analysis & Docker Orchestration Report
**Date:** 2026-02-14
**Scope:** Instances, Usage, and Docker Integration

## 1. Executive Summary
This analysis compares the current API implementation (`/instances/*`) against the project documentation (`docs/infrastructure/*`, `docs/protocol/*`). While the core logic for authentication and data flow exists, significant gaps exist in **Hardware Attestation**, **Docker Configuration validation**, and **Usage Telemetry strictness**.

## 2. Identified Gaps

### A. Instance Registration (`/api/instances/register`)
**Current State:**
- Accepts a generic `config` JSON object.
- Validates cryptographic signature and timestamp.
- Stores data blindly into `deployed_instances`.

**Missing Requirements (per `hosting.md` & `node-management.md`):**
1.  **Hardware Attestation**: The docs mention "Dynamic Selection" based on VRAM/RAM (e.g., "Llama-3-70B on 48GB VRAM"). The API does not validate or enforce a `hardware_spec` schema.
2.  **Docker Context**: No validation of Docker runtime environment (Version, Runtimes like `nvidia-container-runtime` for GPU support).
3.  **Capability Declaration**: No structured field to declare "I support Gateway Mode" or "I support Miner Mode" (Gateway vs Miner logic).

**Recommendation:**
- Enforce a strict `InstanceConfig` schema during registration.
- Require `hardware: { vram_gb, cpu_cores, ... }` in the payload.
- Require `docker: { version, runtime }` in the payload.

### B. Usage Batch Ingestion (`/api/instances/usage/batch`)
**Current State:**
- Accepts an array of `events` and pushes to Kafka.
- Checks API Key validity.

**Missing Requirements (per `tokenomics.md` & `api-reference.md`):**
1.  **Schema Validation**: The "Inference Voucher" system requires specific fields (`input_tokens`, `output_tokens`, `model`, `signature`). The current endpoint accepts *any* JSON event, which risks polluting the data pipeline/billing.
2.  **Metric Standardization**: No enforcement of standard units (seconds vs ms, bytes vs bits).

**Recommendation:**
- Implement strict validation for `InstanceUsageEvent` items before Kafka publishing.
- Reject batches containing malformed events with 400 Bad Request.

### C. Docker Orchestration Data
**Current State:**
- `deployed_instances` table stores a flat config.

**Missing Requirements:**
- To support the "Service Deployment" described in `hosting.md` (Port mapping, Env injection), the `config` needs to explicitly store:
    - `exposed_ports`: For mapping back to the Control Center.
    - `container_image_hash`: To verify the node is running the *correct* verified code (Security/Attestation).

## 3. Implementation Plan
1.  **Type Definition**: Formalize `HardwareSpec` and `DockerConfig` in `src/types/instance.ts`.
2.  **Validation Logic**: Add Zod (or similar) validation to `register` and `usage` routes.
3.  **Database**: Ensure `deployed_instances.config` is treated as a typed column in application logic.

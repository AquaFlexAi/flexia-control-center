---
title: "TESTING STRATEGY - DDD Design"
description: "Detailed design document for the TESTING STRATEGY component of the FlexIA system, following Domain-Driven Design principles."
keywords: ["ddd", "design", "architecture", "testing-strategy", "specification"]
category: "Reports"
last_updated: "2026-02-13"
---
# Testing & Verification Strategy

## 1. Overview
Ensuring the reliability of a decentralized financial system requires rigorous testing at multiple levels: Unit, Integration, and High-Volume Stress Testing.

## 2. Test Scripts
We maintain a suite of standalone scripts in `./scripts/` to verify core behaviors without needing the full UI stack.

### 2.1 Functional Verification
-   **`verify-oracle.ts`**:
    -   **Goal**: Validates the Oracle's ability to aggregate usage and calculate rewards.
    -   **Method**: Creates a mock instance, inserts known usage events, runs `aggregateUsage()`, and asserts that `TotalTokens` and `TotalCost` match expected values.
-   **`test-usage-api.ts`**:
    -   **Goal**: Validates the end-to-end Ingestion Pipeline.
    -   **Method**: Sends a POST request to`/api/instances/usage/batch` and polls the database to confirm the worker process `usage-ingestion.ts` correctly inserted and calculated the resource value.

### 2.2 Stress Testing
-   **`stress-test-oracle.ts`**:
    -   **Goal**: Performance benchmarks for the Aggregation SQL query.
    -   **Scale**: Simulates 100-500+ Miners and 10k-50k+ Usage Events.
    -   **Metrics**: Measures Execution Time (ms) and formatting overhead.
    -   **Target**: Aggregation of 50k events should take < 500ms.

### 2.3 Verification Scripts
-   **`verify-islamic-setup.js`**: Checks that the correct admin users and default quotas exist.
-   **`verify-mining.ts`**: Simulates a full mining epoch for a specific Router ID.

## 3. Continuous Integration
Ideally, these scripts should be run in a CI pipeline (GitHub Actions) against a test Supabase instance.

1.  **Setup**: `supabase start` (Local DB).
2.  **Seed**: Apply `supabase/docker/init/*.sql`.
3.  **Run**: `yarn tsx scripts/verify-oracle.ts`.
4.  **Assert**: Exit code 0.



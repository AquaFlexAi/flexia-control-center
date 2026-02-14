---
title: "WALKTHROUGH - DDD Design"
description: "Detailed design document for the WALKTHROUGH component of the FlexIA system, following Domain-Driven Design principles."
keywords: ["ddd", "design", "architecture", "walkthrough", "specification"]
category: "Reports"
last_updated: "2026-02-13"
---
# Verification Walkthrough: Decentralized AI Router

## 1. Prerequisites
- Docker containers running (`flexia-supabase-db`, `flexia-kafka`, `flexia-usage-ingestion`, `flexia-control-center`).
- Router Service running locally or in a container.
- Environment variables set (`INSTANCE_INVITE_TOKEN`, `SUPABASE_SERVICE_ROLE_KEY`).

## 2. Verify Instance Registration
1.  **Check Logs:** Observe `ai-router-service` logs on startup. It should say `[Registration] Successful! ID: ...`.
2.  **Check Database:**
    ```bash
    docker exec -it flexia-supabase-db psql -U postgres -c "SELECT * FROM deployed_instances;"
    ```
    Should show the new instance.

## 3. Verify Usage Reporting
1.  **Generate Traffic:** Use the Playground to send a few chat requests.
2.  **Check Router Logs:** Observe `[UsageReporter] Found X unsynced events..`.
3.  **Check Ingestion Worker:** Observe `[UsageIngestion] Ingested X events...`.
4.  **Check Database:**
    ```bash
    docker exec -it flexia-supabase-db psql -U postgres -c "SELECT count(*) FROM instance_usage_events;"
    ```

## 4. Verify Dashboard APIs & UI
1.  **List Instances:**
    - API: `curl http://localhost:3000/api/dashboard/instances`
    - UI: Open `http://localhost:3000/dashboard/instances` in your browser.
2.  **Get Usage Stats:**
    - API: `curl "http://localhost:3000/api/dashboard/usage?start=2024-01-01"`
    - UI: Open `http://localhost:3000/dashboard/usage` in your browser.

## 5. Verify Key Rotation
1.  **Trigger Rotation (Manual Test):**
    Call the rotation function from a temporary script or endpoint.
2.  **Check DB:** Verify `instance_api_keys` has a new active key and the old one is inactive.



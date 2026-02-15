---
title: "API Reference"
description: "Comprehensive API reference for the FlexIA platform, including endpoints for services, instances, and sovereign network."
keywords: ["api", "endpoints", "rest", "reference", "documentation"]
category: "API"
last_updated: "2026-02-14"
---

# API Reference Guide

> **Base URL**: `http://localhost:8043/api` (Local Dev)

This reference documents the 44+ endpoints available in the Control Center.

---

## 🔐 Authentication & Identity

| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `/auth/login` | POST | Authenticate a user via Email/Password or OAuth provider. |
| `/auth/callback` | GET | Handles OAuth callbacks (GitHub, Google). |
| `/auth/permissions` | GET | Returns the RBAC permissions for the current session. |
| `/members` | GET | Lists all members in the current Organization/Team. |

---

## 🚀 Infrastructure & Orchestration

| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `/services` | GET | Lists all available service types (Agent Zero, OpenCode, AI Router). |
| `/services/deploy` | POST | Deploys a new service instance (Docker container). |
| `/services/health-check` | GET | Returns real-time health status of all running containers. |
| `/services/orchestration` | POST | Triggers complex multi-container workflows. |
| `/hosting/nodes` | GET | Lists available compute nodes (Local, Hetzner, AWS). |
| `/hosting/providers` | GET | Manages cloud provider credentials. |

---

## 🌍 Sovereign Network & Blockchain

| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `/sovereign/stats` | GET | Returns global network stats (TPS, Active Miners, Total Staked). |
| `/sovereign/proposals` | GET | Returns a list of governance proposals. |
| `/sovereign/vouchers` | GET | Returns a list of earned/redeemable vouchers for the current miner. |
| `/sovereign/voucher` | POST | **(Authority Only)** Signs an inference voucher for a valid task. |
| `/cron/mining-epoch` | POST | Triggers the Oracle to calculate and mint pending rewards. |
| `/instances/register` | POST | Registers a machine's wallet address on-chain. |

---

## 📊 Observability & Analytics

| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `/logs/stream` | WS | WebSocket for real-time container log streaming. |
| `/logs` | GET | Fetches historical logs with filtering. |
| `/telemetry` | POST | Ingest endpoint for metric data points. |
| `/analytics/usage` | GET | Returns usage graphs (Compute/Tokens) over time performing aggregation. |
| `/analytics/instances` | GET | Returns per-instance performance metrics. |

---

## 💳 Billing & Usage

| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `/billing/status` | GET | Returns current subscription, credit balance, and blockchain rewards (FLA/ETH). |
| `/billing/checkout` | POST | Creates a Stripe checkout session for credit top-up. |
| `/billing/stake` | POST | Verifies an on-chain staking transaction and updates credit balance. |
| `/usage/verify-quota` | POST | Checks if a user has sufficient credits for an action. |
| `/instances/usage/batch` | POST | Processes a batch of usage reports from distributed miners. |

---

## 🛠️ Utilities & Integration

| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `/clickup/connections` | GET | Manages ClickUp integration status. |
| `/webhooks/stripe` | POST | Handles incoming Stripe webhooks. |
| `/faucet` | POST | (Devnet Only) Requests test FLX tokens. |
| `/docs` | GET | Returns the documentation tree structure. |

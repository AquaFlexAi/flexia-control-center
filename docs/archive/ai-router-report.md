---
title: "AI Router Report"
description: "Technical report on the AI Router service, detailing registration, usage reporting, and performance."
keywords: ["ai router", "report", "registration", "usage", "performance"]
category: "Reports"
last_updated: "2026-02-13"
---

# AI Router Service Status Report

## Executive Summary
The **AI Router Service** (internal name `FlexIA-router-app`) is a sophisticated middle-layer designed to provide a unified OpenAI-compatible API on top of multiple AI providers (Anthropic, Google, OpenAI, etc.). It features advanced account management, automatic fallback, and a robust translation engine (`open-sse`) that bridges disparate API formats in real-time.

---

## 🏗 Architecture & Core Components

The service is built as a **Next.js** application with a focus on high-performance streaming and reliability.

| Component | Technology | Description |
| :--- | :--- | :--- |
| **Edge API Routes** | Next.js (`app/api/v1`) | Serves as the OpenAI-compatible entry point for all chat requests. |
| **Routing Engine** | `src/sse/handlers` | Manages format detection, account selection, and multi-model "combos". |
| **Open-SSE Library** | `open-sse/` | The core translation logic. Bridges formats using a "Double Translation" (Source -> OpenAI Schema -> Target) approach. |
| **Auth Service** | `src/sse/services/auth.js` | Implements account selection strategies (`round-robin`, `fill-first`) and manages account cooldowns. |
| **Database** | LowDB (`localDb.js`) | Local JSON-based persistence for storing provider connections, credentials, and settings. |

---

## 🔄 Request Lifecycle

1. **Ingress**: A request arrives at `/1.0.0/chat/completions`.
2. **Format Detection**: The service detects the source format (e.g., standard OpenAI or a specific tool's request).
3. **Account Selection**: The Auth service picks the best available provider account (e.g., an Anthropic account with the highest priority or the oldest used).
4. **Translation (Request)**: `open-sse` converts the incoming payload into the target provider's specific format (e.g., OpenAI -> Claude Messages API).
5. **Execution**: The executor makes the actual HTTP call to the provider.
6. **Translation (Response)**: As the stream returns, `open-sse` translates various provider-specific SSE chunks back into unified OpenAI-compatible chunks.
7. **Fallback**: If a provider returns a 429 (Rate Limit) or 5xx error, the router automatically marks that account as unavailable and retries with the next available account.

---

## 🌟 Key Features

### 1. Multi-Account Fallback
The service treats AI accounts as a pool. If one account fails, it seamlessly switches to the next, significantly improving uptime for tools and agents.

### 2. Universal Translators
Supports deep translation between:
- **Formats**: OpenAI, Claude, Gemini, Kiro.
- **Features**: Bridges complex structures like Tool Use (Function Calling) ensuring tools built for OpenAI work natively on Claude or Gemini.

### 3. Model Combos
Allows defining "Virtual Models" that are actually sequences or fallbacks of different physical models (e.g., try `gpt-4o` first, fallback to `claude-3-5-sonnet`).

### 4. Cloud Sync
Optionally synchronizes provider connections to a cloud backend while keeping execution local for privacy and speed.

---

## 🎯 Conclusion
The AI Router Service is the "brain" that enables FlexIA to be provider-agnostic. Its ability to bridge different AI ecosystems while providing robust failure handling makes it an essential infrastructure component for reliable agentic systems.

> [!IMPORTANT]
> The service uses **Mutexes** during account selection to prevent "thundering herd" issues where multiple requests might try to claim/update the same account simultaneously.


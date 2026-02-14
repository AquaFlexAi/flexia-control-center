---
title: "General System Report"
description: "High-level summary report of the FlexIA system status, development progress, and key metrics."
keywords: ["report", "system status", "metrics", "summary", "development"]
category: "Reports"
last_updated: "2026-02-13"
---

# FlexIA General Report

## Executive Summary
**OpenCode** is an open-source, provider-agnostic AI coding agent designed for high-performance development. It prioritizes a Terminal User Interface (TUI) but offers full Web and Desktop experiences. Its architecture is built on a Client/Server model, enabling remote orchestration of coding tasks through a sophisticated multi-agent system.

---

## 🏗 Architecture & Tech Stack

OpenCode is organized as a **Monorepo** using **Turbo** and **Bun**.

| Component | Technology | Description |
| :--- | :--- | :--- |
| **Core CLI/TUI** | TypeScript, Bun, Yargs | The primary interface for interacting with the agent. |
| **Backend/Server** | Hono | Processes requests, manages sessions, and orchestrates agents. |
| **Frontend (Web/Desktop)** | SolidJS, TailwindCSS, Tauri | Provides a rich IDE-like experience outside the terminal. |
| **AI Orchestration** | Vercel AI SDK (`ai`) | Connects to various LLM providers (Claude, OpenAI, Google). |
| **Code Intelligence** | LSP, Tree-sitter | Provides real-time syntax highlighting, navigation, and editing. |
| **Extensibility** | MCP (Model Context Protocol) | Allows the agent to use external tools and data sources. |

---

## 🤖 How the AI Works

OpenCode uses a **Multi-Agent System** where each agent is specialized for specific types of work.

### 1. The Agent Ecosystem
- **`build` (Primary)**: The default agent with full access. It can read/write files and execute bash commands.
- **`plan` (Strategic)**: A read-only agent focused on analysis and architecture. It cannot edit files by default, making it safe for exploration.
- **`explore` (Specialized)**: Optimized for codebase discovery using grep, glob, and code search tools.
- **`general` (Subagent)**: Handles complex, multi-step sub-tasks in parallel.

### 2. The Orchestration Loop
1. **Request**: The user provides a prompt via CLI or Web UI.
2. **Context**: OpenCode gathers environment context (files, LSP data, session history).
3. **LLM Loop**: The primary agent decides which tools to call based on the prompt.
4. **Tool Execution**: Tools (`edit`, `bash`, `read`, etc.) are executed locally.
5. **Streaming**: Results (logs, diffs, terminal output) are streamed back in real-time.

---

## 🛠 Key Features

### 💻 Hybrid IDE Experience
- **TUI Focus**: Built by Neovim enthusiasts, the terminal interface is designed for speed and power.
- **Web/Desktop App**: A modern, SolidJS-powered interface for those who prefer a graphical environment.
- **Live Terminal**: Integrated PTY (pseudo-terminal) support for real-time command execution.

### 🔧 Powerful Toolset
- **Intelligent Editing**: Uses advanced diffing and patching to apply precise code changes.
- **Advanced Search**: Built-in support for `grep`, `glob`, and semantic code search.
- **External Integration**: First-class support for MCP and ACP (Agentic Control Protocol).

### 🛡 Security & Permissions
- **Granular Control**: Users can configure what each agent is allowed to do.
- **Permission Modes**: "Allow", "Deny", or "Ask" for sensitive actions like bash execution or reading `.env` files.

---

## 🎯 Conclusion
OpenCode isn't just a wrapper for an LLM; it's a comprehensive development environment that bridges the gap between traditional IDEs and AI agents. Its strength lies in its **provider-agnostic** nature and its **Client/Server architecture**, which makes it incredibly flexible for both local and remote development.

> [!NOTE]
> OpenCode is 100% open source and designed to be the "open" alternative to tools like Claude Code or Cursor.


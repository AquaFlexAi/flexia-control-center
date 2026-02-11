# Agent Zero Integration

Agent Zero is the core AI capability of the Flexia platform. It operates as an autonomous agent service that users can interact with via a chat interface.

## Architecture

Agent Zero runs as a separate microservice (Docker container `flexia/agent-zero`). The Control Center acts as a frontend client to this service.

- **Frontend**: `src/components/agent-zero` (Chat interface, Settings, Memory View).
- **Backend Proxy**: `src/app/api/agent-zero` routes requests to the container.
- **Client Library**: `src/lib/agent-zero/api.ts` handles communication.

## Key Features

1.  **Chat Interface**: Real-time interaction with the agent.
    - Supports file attachments.
    - Context awareness (conversation history).
2.  **Memory Management**:
    - The agent maintains a "memory" of interactions.
    - Users can view and manage this memory via the `MemoryView` component.
3.  **Multi-Tenancy**:
    - Supports multiple instances via `X-Instance-ID` header.
    - Each instance maintains its own state and settings.
4.  **Settings**:
    - Configurable agent behavior via the Settings API.

## API Communication

The integration uses a secure API pattern:
- **CSRF Protection**: All state-changing requests require a CSRF token (`getCsrfToken`).
- **Async Messaging**: Long-running agent tasks are handled asynchronously (`/message_async`) with a polling mechanism (`/poll`) for updates.
- **Cookie-based Auth**: Uses `csrf_token_{runtime_id}` cookies.

*Source: `src/lib/agent-zero/api.ts`*

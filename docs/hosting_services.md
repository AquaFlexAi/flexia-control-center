# Hosting & Service Management

Flexia Control Center provides a unified interface for deploying and managing services across different cloud providers (multi-cloud) and local environments.

## Hosting Providers

The system abstracts cloud providers using the `HostingManager` class.

### Supported Providers
1.  **Hetzner Cloud**
    - **Integration**: Direct API integration via `HetznerProvider`.
    - **Features**: Provisioning (create/delete), Listing, Health Checks.
    - **Configuration**: Requires API Token.
    - **Server Types**: Supports standard Hetzner types (CX11, CPX11, etc.) and locations (Nuremberg, Falkenstein, Ashburn, etc.).
2.  **Google Cloud Platform (GCP)**
    - *Integration in progress/planned (referenced in file structure).*
3.  **Local/Custom Nodes**
    - Supports connecting to existing servers via SSH or TCP.

### Security
- Provider credentials (API tokens, SSH keys) are **encrypted at rest** using `EncryptionService` before being stored in the `provider_credentials` table.

*Source: `src/lib/hosting/providers/index.ts`, `src/lib/hosting/providers/hetzner.ts`*

## Service Deployment (Docker)

Services are deployed as Docker containers. The platform acts as an orchestrator.

### Connection Modes
The system communicates with Docker daemons via:
1.  **Local Socket**: For local development or when running on the same host (`//./pipe/docker_engine` or `/var/run/docker.sock`).
2.  **TCP**: Connects to remote Docker hosts exposed via TCP (supports TLS).
3.  **SSH**: Connects to remote Docker hosts via SSH tunneling (using `dockerode`'s SSH support).

### Service Lifecycle
1.  **Image Management**:
    - **Prod**: Forces image pull from registry.
    - **Dev**: Checks for local image first, pulls if missing.
2.  **Container Creation**:
    - Maps ports (Host -> Container).
    - Injects Environment Variables.
    - Manages Volumes/Binds.
    - Sets Restart Policy (`unless-stopped`).

### Service Mapping
The platform maps friendly service names to technical container specs.

**Standard Services:**
- **OpenCode IDE**: Web-based IDE (`flexia/opencode`).
- **Agent Zero Cluster**: AI Agent runtime (`flexia/agent-zero`).
- **AI Router**: Traffic routing service (`ai-router-service`).
- **FlexIA Blockchain**: Oracle & Ledger (`flexia-blockchain`).

*Source: `src/lib/docker.ts`, `src/lib/hosting/services/manager.ts`*

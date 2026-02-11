# System Architecture

Flexia Control Center is a comprehensive platform for managing AI services, cloud infrastructure, and billing with a focus on decentralized and Islamic finance principles.

## Core Technology Stack

- **Frontend Framework**: Next.js 16 (App Router)
- **UI Library**: React 19, Tailwind CSS v4, Framer Motion
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **State Management**: React Server Components & Hooks
- **Payment Processing**: Stripe & Crypto Staking
- **Infrastructure**: Docker, SSH, Cloud Provider APIs (Google, Hetzner)

## High-Level Architecture

The application is structured as a modular monolith with clear separation of concerns:

1.  **Presentation Layer (`src/app`, `src/components`)**
    - Built with Server Components for performance.
    - Client Components used for interactive elements (dashboards, wizards).
    - Uses Tailwind CSS for styling.

2.  **API Layer (`src/app/api`)**
    - Next.js Route Handlers provide the REST API.
    - **RBAC Middleware**: All API routes are protected by a robust Role-Based Access Control system (`src/utils/rbac.ts`).
    - **Validation**: Zod is used for request validation (implied).

3.  **Service Layer (`src/services`, `src/lib`)**
    - Contains business logic.
    - **Hosting Manager**: Abstracts interactions with cloud providers.
    - **Billing Service**: Handles Stripe subscriptions and Crypto staking logic.
    - **Agent Zero**: Core AI agent integration.

4.  **Data Layer (Supabase)**
    - **PostgreSQL**: Primary data store.
    - **Row Level Security (RLS)**: Enforced at the database level for user data isolation.
    - **Migrations**: Managed via SQL files in `supabase/docker/init` and `supabase/migrations`.

## Key Modules

### 1. Authentication & RBAC
A hierarchical role-based system manages access to resources.
- **Roles**: System Admin, Owner, Admin, Manager, Developer, Analyst, Viewer.
- **Permissions**: Granular actions (e.g., `manage_services`, `view_billing`).

### 2. Multi-Cloud Hosting
The platform supports multiple hosting providers through a unified interface.
- **Provider Abstraction**: `HostingManager` handles credentials and connections.
- **Encryption**: Provider credentials are encrypted at rest (`src/lib/security`).

### 3. Hybrid Billing System
Supports both traditional SaaS billing (Stripe) and decentralized staking.
- **Stripe**: Credit card subscriptions (Pro, Enterprise).
- **Crypto Staking**: Users stake assets (BTC, ETH, etc.) to earn "FLX Credits" which unlock tiers. This follows Islamic Finance principles (Yield/Profit sharing).

### 4. Service Orchestration
Manages the lifecycle of AI services and containers.
- **Deployment**: Supports deploying services to connected providers.
- **Monitoring**: Real-time health checks and resource usage tracking.

## Directory Structure

- `src/app`: Routes and Pages.
- `src/components`: Reusable UI components.
- `src/lib`: Core infrastructure logic (Hosting, Security, Events).
- `src/services`: Business logic (Billing, ClickUp, Oracle).
- `src/utils`: Helpers (RBAC, Supabase client).
- `tests`: Vitest suites for Unit, API, and E2E testing.

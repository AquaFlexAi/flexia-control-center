# Flexia Control Center

**The centralized command deck for the Flexia AI Ecosystem.**

Flexia Control Center is a next-generation platform designed to orchestrate AI services, manage multi-cloud infrastructure, and handle decentralized billing and staking. It bridges the gap between Web2 SaaS and Web3 Islamic Finance principles.

---

## 📚 Documentation

Detailed documentation for each module can be found in the [`docs/`](./docs) directory:

- **[System Architecture](./docs/architecture.md)**: High-level overview and tech stack.
- **[Authentication & RBAC](./docs/auth_rbac.md)**: Roles, permissions, and security.
- **[Billing & Staking](./docs/billing_staking.md)**: Hybrid billing model (Stripe + Crypto Staking).
- **[Hosting & Services](./docs/hosting_services.md)**: Docker orchestration and Cloud Providers (Hetzner, GCP).
- **[Agent Zero](./docs/agent_zero.md)**: AI Agent integration details.
- **[Integrations](./docs/integrations.md)**: ClickUp, Kafka, and Oracle services.

---

## 🚀 Key Features

- **🤖 AI Orchestration**: Deploy and manage AI agents (Agent Zero) and services with a few clicks.
- **☁️ Multi-Cloud Support**: Seamlessly provision and manage resources on Hetzner, Google Cloud, or local nodes.
- **🔐 Enterprise Security**: Robust RBAC (Role-Based Access Control) and encrypted credential storage.
- **💳 Hybrid Billing**: 
  - Traditional SaaS subscriptions via Stripe.
  - **Crypto Staking**: Stake assets (BTC, ETH) to earn credits (Islamic Finance compliant yield model).
- **📊 Real-time Analytics**: Live telemetry, resource usage tracking, and financial dashboards.
- **🔗 Integrations**: Two-way sync with ClickUp for project management.

---

## 🛠️ Getting Started

### Prerequisites
- Node.js 18+
- Docker (for local service orchestration)
- Supabase (Local or Cloud)

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-org/flexia-control-center.git
    cd flexia-control-center
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    # or
    bun install
    ```

3.  **Setup Environment:**
    Copy `.env.example` to `.env.local` and configure your keys (Supabase, Stripe, etc.).

4.  **Run Migrations:**
    Initialize the database schema.
    ```bash
    npm run db:reset # Check package.json for exact script
    ```

5.  **Start Development Server:**
    ```bash
    npm run dev
    ```
    Open [http://localhost:3000](http://localhost:3000) to view the app.

---

## 🧪 Testing

The project includes a comprehensive test suite using Vitest.

- **Run all tests:** `npm test`
- **Run E2E API tests:** `npm run test:e2e`
- **Run RBAC Matrix tests:** `npm run test:rbac`

---

## 🏗️ Tech Stack

- **Frontend**: Next.js 16 (App Router), React 19, Tailwind CSS v4
- **Backend**: Next.js API Routes, Supabase (Auth & DB)
- **Infrastructure**: Docker, SSH, Hetzner API
- **Utilities**: Framer Motion (Animations), Recharts (Charts), Zod (Validation)

---

## 📄 License

[MIT](./LICENSE)

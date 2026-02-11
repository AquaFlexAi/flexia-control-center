---
description: How to run, manage, and debug the API E2E test suite
---

# Running API E2E Tests

> **Prerequisites**: The dev server (`npm run dev`) and Supabase must be running locally.

## Quick Commands

### Run All Tests
// turbo
```bash
npm test
```

### Run Specific Suite
// turbo
```bash
npx vitest run tests/api/auth.test.ts
npx vitest run tests/api/services.test.ts
npx vitest run tests/api/billing.test.ts
npx vitest run tests/api/instances.test.ts
npx vitest run tests/api/hosting.test.ts
npx vitest run tests/api/analytics.test.ts
npx vitest run tests/api/platform.test.ts
npx vitest run tests/api/clickup.test.ts
npx vitest run tests/api/webhooks.test.ts
```

### Run RBAC Matrix Only
// turbo
```bash
npm run test:rbac
```

### Watch Mode (re-runs on save)
```bash
npm run test:watch
```

### Visual UI
```bash
npm run test:ui
```

## Architecture

```
tests/
├── setup.ts               # Global setup: env vars, Supabase admin, connectivity checks
├── fixtures/
│   └── test-data.ts       # Test user credentials, mock payloads, factories
├── factories/
│   ├── index.ts           # Master seeder (TestSeeder.seedAll/cleanupAll)
│   ├── users.ts           # Create-if-not-exists for 7 RBAC roles
│   ├── services.ts        # Service records factory
│   ├── instances.ts       # Instance registration factory
│   └── billing.ts         # Credits, subscriptions, quotas
├── helpers/
│   ├── api-client.ts      # Fetch wrapper with X-Trace-ID, session management
│   ├── rbac-matrix.ts     # testPermissionMatrix() for role × route testing
│   ├── assertions.ts      # assertJsonShape, assertDbRecord, waitFor
│   └── trace-reporter.ts  # Export traces as JSON to tests/traces/
└── api/
    ├── auth.test.ts       # Login, permissions
    ├── rbac-matrix.test.ts # Full 7-role × route permission matrix
    ├── services.test.ts   # CRUD, deploy, orchestration, terminal, scraping
    ├── instances.test.ts  # Registration, usage batch, E2E pipeline
    ├── billing.test.ts    # Credits, checkout, staking, status
    ├── hosting.test.ts    # Providers, config, nodes, options
    ├── analytics.test.ts  # Usage analytics, instance analytics
    ├── platform.test.ts   # Stats, logs, members, branding, telemetry, faucet, cron
    ├── clickup.test.ts    # ClickUp integration
    └── webhooks.test.ts   # Stripe webhook signature verification
```

## Debugging Failed Tests

1. Check trace output in `tests/traces/` — each suite exports JSON traces
2. Every API request includes `X-Trace-ID` header for correlation
3. Use `npm run test:ui` for a visual interface with test filtering

## Seeding

The test suite automatically seeds:
- **7 test users** (one per RBAC role) via `TestSeeder.seedAll()`  
- **RBAC permissions** in `role_permissions` table
- **Billing data** (credits, transactions)

Seeding is **idempotent** — safe to run repeatedly.

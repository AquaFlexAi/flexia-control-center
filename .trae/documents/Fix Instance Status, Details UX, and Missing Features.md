## Scope
- Resolve mismatch: instance offline while stats appear active.
- Improve the instance Details experience (clarity, actions, observability).
- Implement missing runtime features: logs, console, health checks, robust start/stop.

## Root Causes (Likely)
- Telemetry route provides fallback data even when instance is offline → misleading charts. [telemetry route](file:///c:/Users/mrcha/OneDrive/Desktop/APP_DEV/FlexAi/flexia-control-center/src/app/api/telemetry/route.ts#L1-L47)
- Health monitor publishes fleet metrics without per-instance runtime guarding. [health-monitor.ts](file:///c:/Users/mrcha/OneDrive/Desktop/APP_DEV/FlexAi/flexia-control-center/src/workers/health-monitor.ts#L187-L206)
- Services status derivation mixes DB flags with container inspection; edge cases mark “online” despite stopped container. [services GET](file:///c:/Users/mrcha/OneDrive/Desktop/APP_DEV/FlexAi/flexia-control-center/src/app/api/services/route.ts#L49-L83)

## Backend Fixes
- Status correctness: derive online/offline strictly from container runtime (Docker inspect) and last heartbeat; never show telemetry for offline instances.
  - Harden mapping in services GET. [services GET](file:///c:/Users/mrcha/OneDrive/Desktop/APP_DEV/FlexAi/flexia-control-center/src/app/api/services/route.ts#L49-L83)
  - Disable telemetry fallback when instance is offline; return 204/empty series. [telemetry route](file:///c:/Users/mrcha/OneDrive/Desktop/APP_DEV/FlexAi/flexia-control-center/src/app/api/telemetry/route.ts#L1-L47)
  - Health monitor: mark offline if container not running, zero-out metrics for offline. [health-monitor.ts](file:///c:/Users/mrcha/OneDrive/Desktop/APP_DEV/FlexAi/flexia-control-center/src/workers/health-monitor.ts#L137-L222)
- Start/Stop reliability: ensure orchestration action creates container if missing, surfaces errors to audit trail.
  - Orchestration route: pre-check existence, create-if-missing, detailed error codes. [route.ts](file:///c:/Users/mrcha/OneDrive/Desktop/APP_DEV/FlexAi/flexia-control-center/src/app/api/services/orchestration/route.ts#L42-L89)
  - Deployment route: idempotent container creation; set status transitions. [deploy route](file:///c:/Users/mrcha/OneDrive/Desktop/APP_DEV/FlexAi/flexia-control-center/src/app/api/services/deploy/route.ts#L96-L137)

## Frontend UX Improvements
- Instance Card: show precise state (Online/Offline/Degraded), last heartbeat, last error; gate charts when offline; primary button becomes Start when offline.
  - [instance-card.tsx](file:///c:/Users/mrcha/OneDrive/Desktop/APP_DEV/FlexAi/flexia-control-center/src/components/instances/instance-card.tsx#L31-L93)
- Service Card Instance List: unify status source and actions; show spinner during transitions; add retry on failure.
  - [InstanceList.tsx](file:///c:/Users/mrcha/OneDrive/Desktop/APP_DEV/FlexAi/flexia-control-center/src/components/services/card/InstanceList.tsx#L13-L43)
- Details Modal revamp: clear tabs → Overview, Metrics, Logs, Console, Config, Audit.
  - Wire metrics to new guarded telemetry; add WebSocket Live Logs; add Console attach; expose health-check trigger.
  - [RouterConfigModal.tsx](file:///c:/Users/mrcha/OneDrive/Desktop/APP_DEV/FlexAi/flexia-control-center/src/components/services/router/RouterConfigModal.tsx#L11-L41)

## Missing Features to Implement
- Live Logs (WS): backend stream (Docker logs) + UI tab.
- Console Attach (TTY): backend exec/attach + UI tab.
- Health Check Trigger: POST endpoint + button in Overview.
- Audit Trail surfacing: show latest events related to instance actions.
- Error surfacing for orchestration actions with human-readable messages.

## Validation
- E2E tests for start/stop/restart paths and offline telemetry behavior. [analytics instances GET](file:///c:/Users/mrcha/OneDrive/Desktop/APP_DEV/FlexAi/flexia-control-center/src/app/api/analytics/instances/route.ts#L37-L96)
- Visual test for Details tabs and action flows.
- Manual run with a simulated offline instance to confirm charts disabled, Start works, logs/console attach succeed.

## Rollout
- Ship backend guards first, then UI gating and new tabs.
- Add RBAC checks where needed; avoid logging secrets.

Approve to proceed and I’ll implement these changes end-to-end, Dear Master.
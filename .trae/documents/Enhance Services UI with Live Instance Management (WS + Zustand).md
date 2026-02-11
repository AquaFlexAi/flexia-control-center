## Goals
- Live instance tracking and management in Services UI
- Replace ad-hoc updates with WebSocket + RPC; centralize stats in Zustand
- Fix naming inconsistencies and missing UI behaviors; add performance guards

## Current Entry Points
- Page & grid: [page.tsx](file:///c:/Users/mrcha/OneDrive/Desktop/APP_DEV/FlexAi/flexia-control-center/src/app/services/page.tsx#L1-L270)
- Data hook: [useServices.ts](file:///c:/Users/mrcha/OneDrive/Desktop/APP_DEV/FlexAi/flexia-control-center/src/hooks/useServices.ts#L17-L128)
- Service card & instances: [service-card.tsx](file:///c:/Users/mrcha/OneDrive/Desktop/APP_DEV/FlexAi/flexia-control-center/src/components/services/service-card.tsx#L105-L183), [InstanceList.tsx](file:///c:/Users/mrcha/OneDrive/Desktop/APP_DEV/FlexAi/flexia-control-center/src/components/services/card/InstanceList.tsx#L14-L114)
- Terminal: [terminal-console.tsx](file:///c:/Users/mrcha/OneDrive/Desktop/APP_DEV/FlexAi/flexia-control-center/src/components/services/terminal-console.tsx#L131-L170)

## Backend Live Channels (no new infra)
- Use existing custom server WS: add subscriptions to service.metrics and service.health_change in a single /api/ws/services channel (JSON events with {serviceId, instances[], status, activeInstances}).
- Reuse container/runtime truth from [services GET](file:///c:/Users/mrcha/OneDrive/Desktop/APP_DEV/FlexAi/flexia-control-center/src/app/api/services/route.ts#L54-L101) and health monitor flags [health-monitor.ts](file:///c:/Users/mrcha/OneDrive/Desktop/APP_DEV/FlexAi/flexia-control-center/src/workers/health-monitor.ts#L203-L212).

## Frontend State & Adapters
1) Create Zustand services store
- Shape: byId map, list, lastUpdate, inflightActions
- Actions: upsertServices(list), patchService(serviceId, partial), upsertInstances(serviceId, instances), setInflight(serviceId, action, on|off)
- Event reducer to normalize runtime flags: is_online, instance_details[].is_running
- Adapter to fix naming: instance_details ⇄ instanceDetails; active_instances ⇄ activeInstances

2) Update useServices hook
- On mount: fetch /api/services → dispatch upsertServices
- WS connect to /api/ws/services: reduce events into store; keep refresh() as fallback
- Route orchestration actions through store inflight flags; optimistic status with pending_action

## UI Wiring
- ServicesPage: read services via store selector; remove double sort fields; keep filters and sorting stable; memoize derived filteredServices
- ServiceCard: gate actions by inflight and is_online; show accurate activeInstances; pass normalized instance_details to InstanceList
- InstanceList: prefer inst.is_running; show Start when !is_running, Stop/Restart when running; maintain compact perf
- ServiceDetailsDrawer: display last audit/log snippet and allow open terminal per instance

## Performance Enhancements
- Batching WS updates with requestAnimationFrame; debounce re-renders in store selectors
- Virtualize bento-grid when > N items (threshold ~50) using simple windowing; keep skeletons
- Ensure minimal re-renders via React.memo and stable callbacks; avoid spreading large service objects

## Missing Issues & Fixes
- Field name inconsistencies (instance_details vs instanceDetails, active_instances vs activeInstances): normalize at store boundary
- Action-state clarity: show transitioning/pending_action on cards; disable repeated clicks
- Error surfacing: toast/banner on orchestration errors (uses structured code from [orchestration route](file:///c:/Users/mrcha/OneDrive/Desktop/APP_DEV/FlexAi/flexia-control-center/src/app/api/services/orchestration/route.ts#L139-L156))
- Mock data fallback: if /api/services returns empty, render a small mock fleet for demo with is_running=false and clear badges (distinct styling)

## Tests
- Unit: adapter normalizes fields; store reducers handle WS events
- UI: render page with mock services; verify action gating & sorting; InstanceList toggles Start/Stop correctly

## Rollout
- Implement store + adapters
- Wire useServices to store + WS; keep Supabase subscription as secondary until WS fully covers
- Update components to selectors; add perf windowing when large
- Ship tests and visual checks

If approved, I will implement the store, WS client integration, UI gating, normalization, and performance tweaks end-to-end, Dear Master.
import { describe, it, expect } from 'vitest';
import { useServicesStore } from '@/store/services';

describe('Services store normalization', () => {
  it('maps instanceDetails to instance_details and computes is_running/active', () => {
    const store = useServicesStore.getState();
    store.upsertServices([{
      id: 'svc1',
      name: 'AI Router',
      status: 'offline',
      instances: 2,
      instanceDetails: [
        { id: 'ai-router-service', name: 'AI Router #1', status: 'running' },
        { id: 'ai-router-service-1', name: 'AI Router #2', status: 'stopped' },
      ]
    }]);
    const list = store.getList();
    const svc = list[0] as any;
    expect(svc.instance_details.length).toBe(2);
    expect(svc.instance_details[0].is_running).toBe(true);
    expect(svc.activeInstances).toBe(1);
    expect(svc.is_online).toBe(false); // computed from status, remains offline
  });
});

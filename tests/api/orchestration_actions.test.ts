import { describe, it, expect, vi } from 'vitest';
import * as OrchestrationRoute from '@/app/api/services/orchestration/route';

describe('Orchestration POST', () => {
  it('returns 422 when default config missing on start', async () => {
    vi.mock('@/utils/supabase/server', () => ({
      createClient: vi.fn(async () => ({
        from: (table: string) => ({
          select: () => ({
            eq: () => ({ single: () => ({ data: { id: 'svc_1', name: 'UnknownService', status: 'offline', type: 'custom' } }) })
          }),
          update: () => ({ eq: () => ({}) }),
          insert: () => ({})
        })
      }))
    }));
    vi.mock('@/lib/docker', () => ({
      SERVICE_DEFAULTS: {},
      SERVICE_CONTAINER_MAP: {},
      inspectContainerState: vi.fn(async () => ({ Missing: true, Running: false })),
      createContainer: vi.fn(),
      startContainer: vi.fn(),
      stopContainer: vi.fn(),
      restartContainer: vi.fn()
    }));
    vi.mock('@/utils/supabase/auth-check', () => ({
      authorize: vi.fn(async () => ({ authorized: true, response: null, user: { id: 'u1' } }))
    }));

    const req = new Request('http://localhost/api/services/orchestration', {
      method: 'POST',
      body: JSON.stringify({ serviceId: 'svc_1', action: 'start' })
    });
    const res = await OrchestrationRoute.POST(req);
    expect((res as Response).status).toBe(422);
  });
});

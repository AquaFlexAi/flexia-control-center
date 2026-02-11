import { describe, it, expect, vi } from 'vitest';
import * as OrchestrationRoute from '@/app/api/services/orchestration/route';

describe('Orchestration POST', () => {
  it('returns 422 when default config missing on start', async () => {
    vi.mock('@/utils/supabase/server', () => ({
      createClient: vi.fn(async () => ({
        from: (table: string) => ({
          select: () => ({
            eq: () => ({ single: () => ({ data: { id: 'svc_1', name: 'UnknownService', status: 'offline' } }) })
          }),
          update: () => ({ eq: () => ({}) }),
          insert: () => ({})
        })
      }))
    }));
    vi.mock('@/lib/docker', () => ({
      getDockerInstance: vi.fn(() => ({
        getContainer: vi.fn(() => ({
          inspect: vi.fn(async () => { throw { statusCode: 404 }; })
        }))
      })),
      SERVICE_DEFAULTS: {},
      SERVICE_CONTAINER_MAP: {},
      createContainer: vi.fn()
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

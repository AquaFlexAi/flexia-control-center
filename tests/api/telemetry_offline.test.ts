import { describe, it, expect, vi } from 'vitest';
import * as TelemetryRoute from '@/app/api/telemetry/route';

describe('Telemetry GET (offline gating)', () => {
  it('returns empty history when no containers are running', async () => {
    vi.mock('@/utils/supabase/auth-check', () => ({
      authorize: vi.fn(async () => ({ authorized: true, response: null }))
    }));
    vi.mock('@/lib/docker', () => ({
      listContainers: vi.fn(async () => []),
      getContainerName: vi.fn((name: string, i: number) => `${name}-${i}`)
    }));
    vi.mock('@/utils/supabase/server', () => ({
      createClient: vi.fn(async () => ({
        from: (table: string) => {
          if (table === 'telemetry') {
            return {
              select: () => ({
                eq: () => ({
                  order: () => ({ limit: () => ({ data: [], error: null }) })
                })
              })
            };
          }
          if (table === 'services') {
            return {
              select: () => ({
                eq: () => ({
                  single: () => ({ data: { name: 'ServiceX', instances: 1 } })
                })
              })
            };
          }
          return { select: () => ({}) } as any;
        }
      }))
    }));

    const req = new Request('http://localhost/api/telemetry?serviceId=svc_123');
    const res = await TelemetryRoute.GET(req);
    const json = await (res as Response).json();
    expect(json.history).toEqual([]);
  });
});

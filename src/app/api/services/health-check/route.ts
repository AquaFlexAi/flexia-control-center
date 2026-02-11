import { NextResponse } from 'next/server';
import { authorize } from '@/utils/supabase/auth-check';
import { API_ROUTE_CONFIG } from '@/config/api-permissions';
import { createAdminClient } from '@/utils/supabase/server';
import { getContainerName, getDockerInstance } from '@/lib/docker';

export async function POST(request: Request) {
  const { authorized, response } = await authorize(API_ROUTE_CONFIG['/api/services/health-check'].POST!);
  if (!authorized) return response!;

  const { serviceId, instanceId } = await request.json();
  if (!serviceId) return NextResponse.json({ error: 'Missing serviceId' }, { status: 400 });

  const supabase = await createAdminClient();
  const { data: service } = await supabase.from('services').select('name').eq('id', serviceId).single();
  if (!service) return NextResponse.json({ error: 'Service not found' }, { status: 404 });

  const containerName = instanceId || getContainerName(service.name, 0);
  try {
    const docker = getDockerInstance();
    const info = await docker.getContainer(containerName).inspect();
    const isRunning = !!info?.State?.Running;
    const health = info?.State?.Health?.Status || (isRunning ? 'healthy' : 'offline');
    return NextResponse.json({
      container: containerName,
      isRunning,
      health,
      state: info.State
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Health check failed' }, { status: 500 });
  }
}

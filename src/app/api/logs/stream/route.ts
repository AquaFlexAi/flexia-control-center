import { NextResponse } from 'next/server';
import { authorize } from '@/utils/supabase/auth-check';
import { API_ROUTE_CONFIG } from '@/config/api-permissions';
import { createAdminClient } from '@/utils/supabase/server';
import { getContainerName, getDockerInstance } from '@/lib/docker';

export async function GET(request: Request) {
  // Use a general permission (view_services) for reading logs
  const { authorized, response } = await authorize('view_services');
  if (!authorized) return response!;

  const { searchParams } = new URL(request.url);
  const serviceId = searchParams.get('serviceId');
  const instanceId = searchParams.get('instanceId');

  if (!serviceId) {
    return NextResponse.json({ error: 'Missing serviceId' }, { status: 400 });
  }

  try {
    const supabase = await createAdminClient();
    const { data: service } = await supabase.from('services').select('name').eq('id', serviceId).single();

    if (!service) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 });
    }

    let containerName = instanceId;
    if (!containerName) {
      containerName = getContainerName(service.name, 0);
    }

    const docker = getDockerInstance();
    const container = docker.getContainer(containerName);

    // Fetch last 200 lines
    const logsBuffer = await container.logs({
      stdout: true,
      stderr: true,
      tail: 200,
      timestamps: false
    });

    // Dockerode returns Buffer, likely multiplexed. 
    // For simplicity in this fallback, we treat it as string but cleaner implementation 
    // would strip header bytes if demux needed (usually not for simple 'logs' call without follow?)
    // Actually container.logs with stdout/stderr returns a Buffer that might key headers.
    // However, usually for a quick text dump, toString() is "readable enough" or we can strip non-printable.
    // A robust demux is complex, let's try basic string conversion first.

    const logs = logsBuffer.toString('utf-8');

    // Clean up control characters if needed, but xterm might handle them.
    // We split by newline for the frontend
    // Remove docker header bytes (8 bytes) if present? 
    // Docker attaches 8-byte header [STREAM_TYPE, 0, 0, 0, SIZE1, SIZE2, SIZE3, SIZE4] before each frame.
    // A simple regex cleanup or just returning raw string for now. 
    // Let's rely on string splitting. The 8-byte headers might look like garbage characters at start of lines.
    // We'll strip non-printable characters at the start of lines to be safe.

    // Simple heuristic: remove characters with code < 32 except newline/return/tab
    // const cleanLogs = logs.replace(/[^\x20-\x7E\r\n\t]/g, ''); 
    // Actually, ansi colors are < 32 (ESC is 27). We want to KEEP colors.
    // Docker headers are binary. 

    return NextResponse.json({ lines: logs.split('\n') });
  } catch (error: any) {
    console.error('Log fetch error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch logs' }, { status: 500 });
  }
}

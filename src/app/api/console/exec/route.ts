import { NextResponse } from 'next/server';
import { authorize } from '@/utils/supabase/auth-check';
import { API_ROUTE_CONFIG } from '@/config/api-permissions';
import { createAdminClient } from '@/utils/supabase/server';
import { getContainerName, getDockerInstance } from '@/lib/docker';

export async function POST(request: Request) {
  const { authorized, response } = await authorize(API_ROUTE_CONFIG['/api/console/exec'].POST!);
  if (!authorized) return response!;

  const { serviceId, instanceId, cmd } = await request.json();
  if (!serviceId || !cmd || !Array.isArray(cmd) || cmd.length === 0) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }

  const supabase = await createAdminClient();
  const { data: service } = await supabase.from('services').select('name').eq('id', serviceId).single();
  if (!service) {
    return NextResponse.json({ error: 'Service not found' }, { status: 404 });
  }

  const containerName = instanceId || getContainerName(service.name, 0);
  try {
    const docker = getDockerInstance();
    const container = docker.getContainer(containerName);
    const exec = await container.exec({
      Cmd: cmd,
      AttachStdout: true,
      AttachStderr: true,
    });
    const stream = await exec.start({ hijack: true, stdin: false });

    let output = '';
    await new Promise<void>((resolve, reject) => {
      stream.on('data', (chunk: Buffer) => { output += chunk.toString('utf-8'); });
      stream.on('end', () => resolve());
      stream.on('error', (err: any) => reject(err));
    });

    return NextResponse.json({ output });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'exec failed' }, { status: 500 });
  }
}

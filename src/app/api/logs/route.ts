export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { authorize } from '@/utils/supabase/auth-check';
import { API_ROUTE_CONFIG } from '@/config/api-permissions';
import { createClient } from '@/utils/supabase/server';

export async function GET(request: Request) {
  const { authorized, response } = await authorize(API_ROUTE_CONFIG['/api/logs'].GET!);
  if (!authorized) return response!;

  const supabase = await createClient();
  const { searchParams } = new URL(request.url);
  const serviceId = searchParams.get('serviceId');
  if (!serviceId) return NextResponse.json({ error: 'Missing serviceId' }, { status: 400 });

  const { data, error } = await supabase
    .from('logs')
    .select('id, level, message, details, created_at')
    .eq('service_id', serviceId)
    .order('created_at', { ascending: false })
    .limit(25);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ logs: data || [] });
}

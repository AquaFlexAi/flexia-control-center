import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import { ChatInterface } from '@/components/agent-zero/ChatInterface';
import { resolveAgentZeroUrl } from '@/lib/agent-zero/server';

// Helper to fetch settings directly from the instance
async function getSettingsServer(instanceUrl: string) {
  try {
    // Ensure URL has protocol
    const url = instanceUrl.startsWith('http') ? instanceUrl : `http://${instanceUrl}`;
    const res = await fetch(`${url}/settings_get`, {
      cache: 'no-store',
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.settings;
  } catch (e) {
    console.error("Failed to fetch settings server-side", e);
    return null;
  }
}

interface PageProps {
  params: Promise<{ instanceId: string }>;
}

export default async function AgentZeroInstancePage({ params }: PageProps) {
  const { instanceId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect('/login');
  }

  // Resolve Instance Node to get connection details
  let instanceUrl = process.env.AGENT_ZERO_URL || 'http://localhost:8081'; // Fallback
  let instanceName = instanceId;

  const resolved = await resolveAgentZeroUrl(instanceId);
  if (resolved) {
      instanceUrl = resolved.url;
      instanceName = resolved.name;
  } else {
      console.warn(`Instance ${instanceId} not found or not resolvable.`);
  }

  const initialSettings = await getSettingsServer(instanceUrl);

  return (
    <div className="h-full w-full overflow-hidden">
      <ChatInterface 
        initialSettings={initialSettings} 
        instanceId={instanceId}
        instanceName={instanceName}
      />
    </div>
  );
}

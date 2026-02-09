
export const AGENT_ZERO_API_BASE = '/api/agent-zero';

export interface AgentZeroResponse {
  success: boolean;
  error?: string;
  data?: any;
}

let csrfToken: string | null = null;

async function getCsrfToken(instanceId?: string): Promise<string> {
  if (csrfToken) return csrfToken;
  
  const headers: HeadersInit = {};
  if (instanceId) {
      headers['X-Instance-ID'] = instanceId;
  }

  const res = await fetch(`${AGENT_ZERO_API_BASE}/csrf_token`, {
    credentials: 'include',
    headers,
  });
  
  if (!res.ok) {
    throw new Error(`Failed to fetch CSRF token: ${res.status}`);
  }
  
  const json = await res.json();
  if (json.ok) {
    csrfToken = json.token;
    if (typeof document !== 'undefined' && json.runtime_id) {
        document.cookie = `csrf_token_${json.runtime_id}=${csrfToken}; SameSite=Strict; Path=/`;
    }
    return json.token;
  } else {
    throw new Error(json.error || "Failed to get CSRF token");
  }
}

export async function fetchAgentZero(endpoint: string, options: RequestInit = {}, retry = true, instanceId?: string): Promise<any> {
  const url = `${AGENT_ZERO_API_BASE}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  
  // Ensure token
  if (!csrfToken) {
    try {
        await getCsrfToken(instanceId);
    } catch (e) {
        console.error("CSRF Token fetch failed", e);
    }
  }

  const headers = new Headers(options.headers || {});
  if (csrfToken) {
    headers.set('X-CSRF-Token', csrfToken);
  }
  if (instanceId) {
      headers.set('X-Instance-ID', instanceId);
  }

  const newOptions = {
    ...options,
    headers,
    credentials: 'include' as RequestCredentials,
  };

  const res = await fetch(url, newOptions);

  if (res.status === 403 && retry) {
    // Retry once if CSRF invalid
    csrfToken = null;
    return fetchAgentZero(endpoint, options, false, instanceId);
  }

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Agent Zero API Error: ${res.status} ${res.statusText} - ${text}`);
  }
  
  return res.json();
}

export async function sendMessage(text: string, context: string | null = null, files: File[] = [], instanceId?: string) {
  const formData = new FormData();
  formData.append('text', text);
  formData.append('message_id', crypto.randomUUID());
  if (context) {
    formData.append('context', context);
  }
  
  files.forEach(file => formData.append('attachments', file));

  if (files.length > 0) {
      return fetchAgentZero('/message_async', {
        method: 'POST',
        body: formData,
      }, true, instanceId);
  } else {
      return fetchAgentZero('/message_async', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            text,
            context,
            message_id: crypto.randomUUID(),
        }),
      }, true, instanceId);
  }
}

export async function pollAgentZero(
  context: string | null, 
  logFrom: number = 0, 
  notificationsFrom: number = 0,
  instanceId?: string
) {
  return fetchAgentZero('/poll', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      context: context || '',
      log_from: logFrom,
      notifications_from: notificationsFrom,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    }),
  }, true, instanceId);
}

export async function createChat(currentContext?: string, instanceId?: string) {
  return fetchAgentZero('/chat_create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      current_context: currentContext || '',
      new_context: crypto.randomUUID(),
    }),
  }, true, instanceId);
}

export async function getHistory(context: string, instanceId?: string) {
    return fetchAgentZero('/history_get', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ context }),
    }, true, instanceId);
}

export async function getSettings(instanceId?: string) {
    return fetchAgentZero('/settings_get', {
        method: 'GET',
    }, true, instanceId);
}

export async function saveSettings(settings: any, instanceId?: string) {
    return fetchAgentZero('/settings_set', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
    }, true, instanceId);
}

export async function memoryAction(action: string, params: any = {}, instanceId?: string) {
    return fetchAgentZero('/memory_dashboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ...params }),
    }, true, instanceId);
}

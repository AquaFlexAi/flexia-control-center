import React, { useEffect, useState } from 'react';

interface AuditTabProps {
  serviceId: string;
}

type LogEntry = {
  id: string;
  level: string;
  message: string;
  details?: any;
  created_at?: string;
};

export function AuditTab({ serviceId }: AuditTabProps) {
  const [entries, setEntries] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/logs?serviceId=${serviceId}`);
        if (!res.ok) {
          throw new Error('Failed to fetch audit logs');
        }
        const json = await res.json();
        if (!cancelled) {
          setEntries(json.logs || []);
        }
      } catch (e: any) {
        if (!cancelled) setError(e.message || 'Error fetching logs');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [serviceId]);

  if (loading) return <div className="text-xs text-muted-foreground">Loading audit trail…</div>;
  if (error) return <div className="text-xs text-destructive">Error: {error}</div>;

  if (!entries.length) {
    return <div className="text-xs text-muted-foreground">No audit events found.</div>;
  }

  return (
    <div className="space-y-2">
      {entries.map((e) => (
        <div key={e.id} className="p-3 rounded-lg border border-white/10 bg-black/20">
          <div className="text-[10px] text-muted-foreground uppercase tracking-wider">{e.level}</div>
          <div className="text-sm">{e.message}</div>
          {e.details && (
            <pre className="mt-2 text-[10px] bg-black/30 p-2 rounded-md overflow-x-auto">{JSON.stringify(e.details, null, 2)}</pre>
          )}
        </div>
      ))}
    </div>
  );
}

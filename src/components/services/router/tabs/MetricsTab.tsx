import React, { useEffect, useState } from 'react';
import { useStatsStore } from '@/store/stats';

interface MetricsTabProps {
  serviceId: string;
}

type TelemetryPoint = {
  recorded_at: string;
  value: number;
  tokens?: number;
};

export function MetricsTab({ serviceId }: MetricsTabProps) {
  const pointsFromStore = useStatsStore(s => s.getTelemetry(serviceId));
  const setTelemetry = useStatsStore(s => s.setTelemetry);
  const [points, setPoints] = useState<TelemetryPoint[]>(pointsFromStore);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/telemetry?serviceId=${serviceId}`);
        const json = await res.json();
        if (!cancelled) {
          const hist = json.history || [];
          setTelemetry(serviceId, hist);
          setPoints(hist);
        }
      } catch (e: any) {
        if (!cancelled) setError(e.message || 'Failed to load telemetry');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [serviceId, setTelemetry]);

  if (loading) return <div className="text-xs text-muted-foreground">Loading metrics…</div>;
  if (error) return <div className="text-xs text-destructive">Error: {error}</div>;

  if (!points.length) {
    return (
      <div className="text-xs text-muted-foreground">
        No telemetry available. If the instance is offline, charts are disabled.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="text-xs text-muted-foreground">Recent Telemetry</div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
        {points.map((p, idx) => (
          <div key={idx} className="p-3 rounded-lg border border-white/10 bg-black/20">
            <div className="text-[10px] text-muted-foreground">
              {new Date(p.recorded_at).toLocaleTimeString()}
            </div>
            <div className="text-sm font-mono">
              load: {p.value} {p.tokens != null ? `| tokens: ${p.tokens}` : ''}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

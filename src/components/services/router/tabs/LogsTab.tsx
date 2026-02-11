import React, { useEffect, useRef, useState } from 'react';

interface LogsTabProps {
  serviceId: string;
  instanceId: string;
}

export function LogsTab({ serviceId, instanceId }: LogsTabProps) {
  const [lines, setLines] = useState<string[]>([]);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const rafQueue = useRef<string[]>([]);
  const rafScheduled = useRef(false);
  const wsRef = useRef<WebSocket | null>(null);

  const [fallbackMode, setFallbackMode] = useState(false);

  useEffect(() => {
    setLines([]);
    setConnected(false);
    setError(null);
    setFallbackMode(false);

    const ws = new WebSocket(`${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.host}/api/ws/logs?serviceName=&serviceId=${serviceId}&instanceId=${encodeURIComponent(instanceId)}`);
    wsRef.current = ws;

    ws.onopen = () => {
      setConnected(true);
      setFallbackMode(false);
    };

    ws.onmessage = (ev) => {
      try {
        const msg = JSON.parse(ev.data);
        if (msg.type === 'log') {
          rafQueue.current.push(msg.data);
          if (!rafScheduled.current) {
            rafScheduled.current = true;
            requestAnimationFrame(() => {
              rafScheduled.current = false;
              if (rafQueue.current.length) {
                setLines(prev => {
                  const merged = [...prev, ...rafQueue.current];
                  rafQueue.current = [];
                  return merged.slice(-1000);
                });
                bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
              }
            });
          }
        } else if (msg.type === 'end') {
          setConnected(false);
        } else if (msg.type === 'error') {
          setError(msg.message || 'Stream error');
        }
      } catch {
        // ignore
      }
    };

    ws.onerror = () => {
      console.warn('WebSocket connection failed, switching to polling mode.');
      setFallbackMode(true);
      setError(null);
    };

    ws.onclose = () => {
      setConnected(false);
      // If we never connected, this might be an immediate close due to 404
      if (!connected) {
        setFallbackMode(true);
      }
    };

    return () => {
      try { ws.close(); } catch { }
    };
  }, [serviceId, instanceId]);

  // Polling Fallback
  useEffect(() => {
    if (!fallbackMode) return;

    setConnected(true); // Pretend we are connected

    const fetchLogs = async () => {
      try {
        const res = await fetch(`/api/logs/stream?serviceId=${serviceId}&instanceId=${encodeURIComponent(instanceId)}`);
        if (res.ok) {
          const data = await res.json();
          if (data.lines) {
            setLines(data.lines); // Replace lines, simple polling
            bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
          }
        }
      } catch (e) {
        console.error(e);
      }
    };

    fetchLogs();
    const interval = setInterval(fetchLogs, 2000);
    return () => clearInterval(interval);
  }, [fallbackMode, serviceId, instanceId]);

  return (
    <div className="space-y-3">
      <div className="text-xs text-muted-foreground">
        {connected ? 'Streaming live logs…' : 'Connecting to log stream…'}
        {error && <span className="ml-2 text-destructive">Error: {error}</span>}
      </div>
      <div className="p-3 rounded-lg border border-white/10 bg-black/20 font-mono text-[11px] text-muted-foreground max-h-64 overflow-auto">
        {lines.length === 0 && <div className="opacity-60">Waiting for stream…</div>}
        {lines.map((l, i) => (
          <div key={i} className="whitespace-pre">{l}</div>
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}

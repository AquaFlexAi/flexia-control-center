import React, { useState } from 'react';

interface ConsoleTabProps {
  serviceId: string;
  instanceId: string;
}

export function ConsoleTab({ serviceId, instanceId }: ConsoleTabProps) {
  const [cmd, setCmd] = useState<string>('uname -a');
  const [output, setOutput] = useState<string>('');
  const [loading, setLoading] = useState(false);

  async function runCmd() {
    setLoading(true);
    setOutput('');
    try {
      const res = await fetch('/api/console/exec', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ serviceId, instanceId, cmd: cmd.split(' ') })
      });
      const json = await res.json();
      if (res.ok) {
        setOutput(json.output || '');
      } else {
        setOutput(`Error: ${json.error || 'failed'}`);
      }
    } catch (e: any) {
      setOutput(`Error: ${e.message}`);
    } finally {
      setLoading(false);
    }
  }
  return (
    <div className="space-y-3">
      <div className="text-xs text-muted-foreground">
        Interactive console attach will be enabled here. Use the Terminal button on the instance row for now.
      </div>
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <input
            value={cmd}
            onChange={(e) => setCmd(e.target.value)}
            className="flex-1 p-2 rounded-md bg-black/30 border border-white/10 text-sm font-mono"
            placeholder="Enter command (e.g., ls -la)"
          />
          <button onClick={runCmd} disabled={loading} className="px-3 py-2 rounded-md bg-white/10 hover:bg-white/20 text-xs">
            {loading ? 'Running…' : 'Run'}
          </button>
        </div>
        <div className="p-4 rounded-lg border border-white/10 bg-black/20 font-mono text-[11px] text-muted-foreground">
          service: {serviceId} | instance: {instanceId}
          <pre className="mt-2 whitespace-pre-wrap">{output || 'Output will appear here.'}</pre>
        </div>
      </div>
    </div>
  );
}

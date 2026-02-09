'use client';

import { useState, useEffect } from 'react';
import { memoryAction } from '@/lib/agent-zero/api';
import { Loader2, Search, Trash2, RefreshCw } from 'lucide-react';

export function MemoryView({ instanceId }: { instanceId?: string }) {
  const [query, setQuery] = useState('');
  const [memories, setMemories] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [subdirs, setSubdirs] = useState<string[]>([]);
  const [currentSubdir, setCurrentSubdir] = useState('default');

  useEffect(() => {
    loadSubdirs();
    handleSearch(); // Initial load
  }, [instanceId]);

  const loadSubdirs = async () => {
    try {
        const res = await memoryAction('get_memory_subdirs', {}, instanceId);
        if (res.subdirs) setSubdirs(res.subdirs);
    } catch (e) {
        console.error(e);
    }
  };

  const handleSearch = async () => {
    try {
      setLoading(true);
      const res = await memoryAction('search', { 
          query: query || '*', 
          memory_subdir: currentSubdir,
          limit: 50 
      }, instanceId);
      if (res.memories) {
          setMemories(res.memories);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
      if (!confirm("Are you sure you want to delete this memory?")) return;
      try {
          await memoryAction('delete', { memory_id: id, memory_subdir: currentSubdir }, instanceId);
          handleSearch();
      } catch (e) {
          console.error(e);
      }
  };

  return (
    <div className="flex flex-col h-full p-4 md:p-6 space-y-4 overflow-hidden">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h2 className="text-2xl font-bold">Memory Management</h2>
        <div className="flex items-center gap-2 w-full md:w-auto">
            <select 
                value={currentSubdir} 
                onChange={(e) => {
                    setCurrentSubdir(e.target.value);
                    // trigger search in effect or manual? manual for now
                    setTimeout(() => handleSearch(), 0);
                }}
                className="flex-1 md:flex-none border rounded px-2 py-1 bg-background"
            >
                <option value="default">Default</option>
                {subdirs.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <button onClick={handleSearch} className="p-2 hover:bg-muted rounded shrink-0">
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
        </div>
      </div>

      <div className="flex gap-2">
        <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <input 
                type="text" 
                placeholder="Search memories..." 
                className="w-full pl-9 pr-4 py-2 border rounded-md bg-background"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
        </div>
        <button 
            onClick={handleSearch}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
        >
            Search
        </button>
      </div>

      <div className="flex-1 overflow-y-auto border rounded-md">
          {memories.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                  {loading ? 'Searching...' : 'No memories found.'}
              </div>
          ) : (
              <div className="divide-y">
                  {memories.map((mem: any) => (
                      <div key={mem.id} className="p-4 hover:bg-muted/50 group">
                          <div className="flex justify-between items-start gap-4">
                              <div className="space-y-1">
                                  <div className="font-medium text-sm line-clamp-1">{mem.document || mem.content || 'Untitled Memory'}</div>
                                  <div className="text-xs text-muted-foreground font-mono">{mem.id}</div>
                                  {mem.metadata && (
                                      <div className="text-xs text-muted-foreground/80 mt-1">
                                          Score: {mem.score?.toFixed(3)}
                                      </div>
                                  )}
                              </div>
                              <button 
                                onClick={() => handleDelete(mem.id)}
                                className="opacity-0 group-hover:opacity-100 p-2 text-destructive hover:bg-destructive/10 rounded transition-all"
                              >
                                  <Trash2 className="h-4 w-4" />
                              </button>
                          </div>
                      </div>
                  ))}
              </div>
          )}
      </div>
    </div>
  );
}

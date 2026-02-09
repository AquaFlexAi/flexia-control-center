'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { pollAgentZero, createChat, sendMessage } from '@/lib/agent-zero/api';
import { ChatInput } from './ChatInput';
import { MessageList } from './MessageList';
import { AppSidebar } from './AppSidebar';
import { ChatWelcome } from './ChatWelcome';
import { SettingsView } from './SettingsView';
import { MemoryView } from './MemoryView';
import { LogEntry } from './types';
import { Loader2, Menu } from 'lucide-react';
import { cn } from '@/lib/utils';

type ViewMode = 'chat' | 'settings' | 'memory';

export function ChatInterface({ initialSettings, instanceId, instanceName }: { initialSettings?: any; instanceId?: string; instanceName?: string }) {
  const [currentContext, setCurrentContext] = useState<string | null>(null);
  const [view, setView] = useState<ViewMode>('chat');
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const [contexts, setContexts] = useState<string[]>([]);
  const [messages, setMessages] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const logFromRef = useRef(0);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  // Initial load
  useEffect(() => {
    const init = async () => {
      try {
        const data = await pollAgentZero(null, 0, 0, instanceId);
        if (data.contexts) {
          // data.contexts is array of objects {id, name, ...} or strings?
          // Based on original code: data.contexts[i].id
          // But let's check what it actually is. The original code used data.contexts[last].id
          // So it is an array of objects.
          // But the type definition in types.ts says `contexts: any[]`.
          // I will assume it is objects with an id property.
          
          // Let's normalize it to just IDs for the sidebar for now, or keep full objects if possible.
          // The sidebar expects string[] for now. I should probably update Sidebar to take objects if I want names.
          // But for now let's stick to IDs or what the API gives.
          // Let's assume the API returns objects and I map them.
          
          const ctxIds = data.contexts.map((c: any) => c.id || c);
          setContexts(ctxIds);
          
          // Do NOT automatically select the last one. Show Welcome screen instead.
          // Unless we want to restore the previous session?
          // User wants "Agent Zero UI" which starts at Welcome screen usually?
          // Or if they select a chat.
          // Let's start with Welcome screen (currentContext = null).
        }
      } catch (err) {
        console.error(err);
        setError("Failed to connect to Agent Zero");
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [instanceId]);

  // Polling for messages when context is selected
  const poll = useCallback(async () => {
    if (!currentContext) return;
    
    try {
      const data = await pollAgentZero(currentContext, logFromRef.current, 0, instanceId);
      
      if (data.logs && data.logs.length > 0) {
        setMessages(prev => {
          const newLogs = data.logs;
          const existingIds = new Set(prev.map(m => m.id));
          const uniqueNewLogs = newLogs.filter((l: LogEntry) => !existingIds.has(l.id));
          
          if (uniqueNewLogs.length === 0) return prev;
          return [...prev, ...uniqueNewLogs];
        });
        logFromRef.current += data.logs.length;
      }
      
      // Also update contexts list if provided (in case new chats created elsewhere)
      if (data.contexts) {
        const ctxIds = data.contexts.map((c: any) => c.id || c);
        // Only update if different to avoid re-renders? 
        // For simplicity setContexts(ctxIds) might be okay but better check length
        setContexts(ctxIds);
      }
      
    } catch (err) {
      console.error("Polling error", err);
    }
  }, [currentContext, instanceId]);

  useEffect(() => {
    // If no context, maybe we should still poll strictly for contexts list?
    // But pollAgentZero(null) does that.
    
    if (!currentContext) {
      // Maybe poll occasionally for list updates?
      const interval = setInterval(async () => {
          try {
             const data = await pollAgentZero(null, 0, 0, instanceId);
             if (data.contexts) {
                 const ctxIds = data.contexts.map((c: any) => c.id || c);
                 setContexts(ctxIds);
             }
          } catch(e) {}
      }, 5000);
      return () => clearInterval(interval);
    }

    // Reset for new context
    setMessages([]);
    logFromRef.current = 0;
    
    // Initial poll
    poll();
    pollingRef.current = setInterval(poll, 1000);
    
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [currentContext, poll, instanceId]);


  const handleSend = async (text: string, files: File[]) => {
    if (!currentContext) return;
    try {
      await sendMessage(text, currentContext, files, instanceId);
      setTimeout(poll, 100); 
    } catch (err) {
      console.error(err);
    }
  };

  const handleNewChat = async () => {
    try {
        const createData = await createChat(instanceId);
        if (createData.ok) {
            // Add to list and select it
            // The polling will pick it up, but let's be optimistic
            const newId = createData.ctxid;
            // setContexts(prev => [...prev, newId]); // Wait for poll to confirm?
            setCurrentContext(newId);
            setView('chat');
        }
    } catch (e) {
        console.error("Failed to create chat", e);
    }
  };

  const handleResetChat = async () => {
      // Implement reset logic? 
      // Usually "Reset" might mean clear history or start over in same context?
      // Or create new context and switch?
      // Agent Zero usually creates a new context when "Reset" is clicked if it acts like "New Chat" but clearing current?
      // Let's treat it as New Chat for now or maybe just clear messages?
      // API doesn't have explicit "reset" endpoint other than createChat?
      // There is `chat_reset.py` in python api. Let's check api.ts if it exports it.
      // api.ts doesn't export resetChat.
      // I'll use handleNewChat for now.
      handleNewChat();
  };

  if (loading) {
      return (
          <div className="flex h-full items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
      );
  }

  if (error) {
      return (
          <div className="flex h-full items-center justify-center flex-col gap-4">
              <div className="text-destructive font-medium">{error}</div>
              <button onClick={() => window.location.reload()} className="text-sm underline">Retry</button>
          </div>
      );
  }

  return (
    <div className="flex h-full w-full bg-background overflow-hidden relative">
        {/* Mobile Overlay */}
        {showMobileSidebar && (
            <div 
                className="fixed inset-0 z-40 bg-black/50 md:hidden backdrop-blur-sm transition-opacity"
                onClick={() => setShowMobileSidebar(false)}
            />
        )}

        <AppSidebar 
            className={cn(
                "md:flex z-50",
                showMobileSidebar ? "flex fixed inset-y-0 left-0 h-full bg-background shadow-xl animate-in slide-in-from-left duration-200" : "hidden"
            )}
            onDashboard={() => {
                setCurrentContext(null);
                setView('chat');
                setShowMobileSidebar(false);
            }}
            onChat={() => {
                setView('chat');
                setShowMobileSidebar(false);
            }}
            onProjects={() => {
                setShowMobileSidebar(false);
            }}
            onMemory={() => {
                setView('memory');
                setShowMobileSidebar(false);
            }}
            onSettings={() => {
                setView('settings');
                setShowMobileSidebar(false);
            }}
        />

        {/* Main Content */}
        <div className="flex-1 flex flex-col h-full min-w-0 bg-background/95">
             {/* Mobile Header */}
            <div className="md:hidden flex items-center h-14 border-b px-4 shrink-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 gap-3 z-30 sticky top-0">
                 <button onClick={() => setShowMobileSidebar(true)} className="p-2 -ml-2 hover:bg-muted rounded-md">
                     <Menu className="w-5 h-5" />
                 </button>
                 <span className="font-semibold text-sm">
                    {view === 'settings' ? 'Settings' : view === 'memory' ? 'Memory' : currentContext ? `Chat: ${currentContext.substring(0, 8)}` : 'Agent Zero'}
                 </span>
            </div>

            {view === 'settings' ? (
                <div className="flex-1 overflow-y-auto p-4 md:p-8 scroll-smooth">
                    <SettingsView initialSettings={initialSettings} instanceId={instanceId} />
                </div>
            ) : view === 'memory' ? (
                <div className="flex-1 flex flex-col min-h-0">
                    <MemoryView instanceId={instanceId} />
                </div>
            ) : !currentContext ? (
                <ChatWelcome 
                    onNewChat={handleNewChat}
                    onSettings={() => setView('settings')}
                    onMemory={() => setView('memory')}
                    onProjects={() => {}}
                />
            ) : (
                <>
                    <header className="hidden md:flex h-14 items-center border-b px-6 bg-muted/40 shrink-0 justify-between">
                        <div className="font-semibold flex items-center gap-2">
                            Agent Zero 
                            <span className="text-xs font-normal text-muted-foreground font-mono bg-muted px-2 py-0.5 rounded">
                                {currentContext.substring(0, 8)}
                            </span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                            {messages.length} messages
                        </div>
                    </header>
                    
                    <MessageList messages={messages} />
                    <ChatInput 
                        onSendMessage={handleSend}
                        disabled={false} 
                    />
                </>
            )}
        </div>
    </div>
  );
}

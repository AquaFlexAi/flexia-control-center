'use client';

import { LogEntry } from './types';
import { User, Bot, Terminal, AlertTriangle, Info, Monitor } from 'lucide-react';
import { useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface MessageListProps {
  messages: LogEntry[];
}

export function MessageList({ messages }: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const getIcon = (type: string) => {
    switch (type) {
      case 'user': return <User className="h-5 w-5" />;
      case 'agent': return <Bot className="h-5 w-5" />;
      case 'response': return <Bot className="h-5 w-5" />;
      case 'tool': return <Terminal className="h-5 w-5" />;
      case 'code_exe': return <Terminal className="h-5 w-5 text-green-500" />;
      case 'browser': return <Monitor className="h-5 w-5 text-blue-500" />;
      case 'error': return <AlertTriangle className="h-5 w-5 text-red-500" />;
      case 'warning': return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      default: return <Info className="h-5 w-5" />;
    }
  };

  const getContainerClass = (type: string) => {
      switch(type) {
          case 'user': return 'flex flex-row-reverse';
          case 'agent': 
          case 'response':
            return 'flex flex-row';
          default: return 'flex flex-row justify-center';
      }
  };

  const getBubbleClass = (type: string) => {
      switch(type) {
          case 'user': return 'bg-primary text-primary-foreground ml-12 rounded-2xl rounded-tr-sm';
          case 'agent': 
          case 'response':
            return 'bg-muted mr-12 rounded-2xl rounded-tl-sm';
          case 'tool':
          case 'code_exe':
          case 'browser':
             return 'bg-black/5 dark:bg-white/5 w-full font-mono text-xs border border-border rounded-lg';
          case 'error': return 'bg-red-500/10 border-red-500/20 text-red-500 w-full rounded-lg border';
          case 'warning': return 'bg-yellow-500/10 border-yellow-500/20 text-yellow-500 w-full rounded-lg border';
          default: return 'bg-muted/50 w-full rounded-lg';
      }
  };

  return (
    <div className="flex-1 overflow-y-auto p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {messages.map((msg) => {
             const isSystem = ['tool', 'code_exe', 'browser', 'error', 'warning', 'info'].includes(msg.type);
             
             return (
              <div
                key={msg.id}
                className={`${getContainerClass(msg.type)} animate-in fade-in slide-in-from-bottom-2 duration-300`}
              >
                {!isSystem && msg.type !== 'user' && (
                     <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center mr-2 shrink-0">
                         {getIcon(msg.type)}
                     </div>
                )}
                
                <div className={`p-4 ${getBubbleClass(msg.type)}`}>
                  {msg.heading && (
                    <div className="font-semibold mb-1 opacity-70 text-xs uppercase tracking-wider flex items-center gap-2">
                       {isSystem && getIcon(msg.type)}
                       {msg.heading}
                    </div>
                  )}
                  <div className={`break-words ${isSystem ? 'overflow-x-auto font-mono text-xs' : ''}`}>
                    {msg.type === 'agent' || msg.type === 'response' ? (
                      <div className="prose dark:prose-invert max-w-none text-sm">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {msg.content}
                        </ReactMarkdown>
                      </div>
                    ) : (
                        <div className="whitespace-pre-wrap">
                            {msg.content}
                        </div>
                    )}
                    
                    {msg.kvps && msg.kvps.attachments && Array.isArray(msg.kvps.attachments) && msg.kvps.attachments.length > 0 && (
                        <div className="mt-2 pt-2 border-t border-border/50 text-xs">
                            <div className="font-semibold opacity-70 mb-1">Attachments:</div>
                            <ul className="list-disc list-inside opacity-80">
                                {msg.kvps.attachments.map((att: string, i: number) => (
                                    <li key={i}>{att}</li>
                                ))}
                            </ul>
                        </div>
                    )}
                  </div>
                </div>

                {!isSystem && msg.type === 'user' && (
                     <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center ml-2 shrink-0 text-primary-foreground">
                         {getIcon(msg.type)}
                     </div>
                )}
              </div>
            );
        })}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}

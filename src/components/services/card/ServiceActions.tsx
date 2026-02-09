import React from 'react';
import { Play, Square, RotateCw, Settings } from 'lucide-react';
import { cn } from "@/lib/utils";

interface ServiceActionsProps {
    status: string;
    loading: boolean;
    onAction: (action: 'start' | 'stop' | 'restart') => void;
    onConfigure: () => void;
}

export function ServiceActions({ status, loading, onAction, onConfigure }: ServiceActionsProps) {
    const isOnline = status === 'ONLINE' || status === 'online';

    return (
        <div className="flex items-center gap-2 mt-auto">
            {!isOnline && (
                <button 
                    onClick={() => onAction('start')}
                    disabled={loading}
                    className="flex-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 rounded-lg py-2 flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
                >
                    <Play className="w-4 h-4 fill-current group-hover:scale-110 transition-transform" />
                    <span className="text-xs font-bold uppercase tracking-wider">Start</span>
                </button>
            )}
            
            {isOnline && (
                <>
                    <button 
                        onClick={() => onAction('restart')}
                        disabled={loading}
                        className="flex-1 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 rounded-lg py-2 flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
                    >
                        <RotateCw className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" />
                        <span className="text-xs font-bold uppercase tracking-wider">Restart</span>
                    </button>
                    <button 
                        onClick={() => onAction('stop')}
                        disabled={loading}
                        className="px-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-lg py-2 flex items-center justify-center transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 active:scale-95"
                        title="Stop Service"
                    >
                        <Square className="w-4 h-4 fill-current" />
                    </button>
                </>
            )}

            <button 
                onClick={onConfigure}
                className="px-3 bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-white border border-white/5 rounded-lg py-2 flex items-center justify-center transition-all hover:rotate-45 active:scale-95"
                title="Configure"
            >
                <Settings className="w-4 h-4" />
            </button>
        </div>
    );
}

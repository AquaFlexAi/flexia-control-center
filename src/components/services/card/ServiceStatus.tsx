import React from 'react';
import { Loader2, AlertCircle, CheckCircle2, Clock } from 'lucide-react';
import { cn } from "@/lib/utils";

interface ServiceStatusProps {
    status: string;
    health?: string;
    loading?: boolean;
}

export function ServiceStatus({ status, health, loading }: ServiceStatusProps) {
    const isOnline = status === 'ONLINE' || status === 'online';
    const isProcessing = status === 'PROCESSING' || status === 'processing';
    const isDegraded = health === 'degraded';

    return (
        <div className={cn(
            "flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full transition-colors duration-300",
            isOnline ? (isDegraded ? "bg-yellow-500/10 text-yellow-400" : "bg-emerald-500/10 text-emerald-400") : 
            isProcessing ? "bg-blue-500/10 text-blue-400" : "bg-red-500/10 text-red-400"
        )}>
            {loading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : isOnline ? (
                isDegraded ? <AlertCircle className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />
            ) : isProcessing ? (
                <Clock className="w-3.5 h-3.5" />
            ) : (
                <AlertCircle className="w-3.5 h-3.5" />
            )}
            {loading ? 'SYNCING' : (isDegraded && isOnline ? 'ONLINE (PARTIAL)' : status)}
        </div>
    );
}

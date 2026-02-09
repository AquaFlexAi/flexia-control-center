import React from 'react';
import { Server } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Service } from '@/types/service';

interface ServiceStatusProps {
    status: Service['status'];
}

export function ServiceStatus({ status }: ServiceStatusProps) {
    return (
        <div className="relative group">
            <div className="w-16 h-16 rounded-2xl glass flex items-center justify-center group-hover:bg-white/5 transition-all">
                <Server className={cn("w-8 h-8 transition-colors", status === 'online' ? 'text-purple-400' : 'text-muted-foreground/40')} />
            </div>
            <div className={cn(
                "absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-4 border-[#030303] transition-colors duration-700",
                status === "online" ? "bg-emerald-500" :
                    status === "transitioning" ? "bg-yellow-400 animate-pulse" : "bg-muted-foreground/30"
            )} />
        </div>
    );
}

import { WifiOff } from 'lucide-react';

interface StatusPillProps {
    isOnline: boolean;
    status: string;
}

export function StatusPill({ isOnline, status }: StatusPillProps) {
    if (isOnline) {
        return (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
                <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
                Online
            </span>
        );
    }
    return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-destructive/15 text-destructive border border-destructive/20">
            <WifiOff className="w-3 h-3" />
            {status === 'suspended' ? 'Suspended' : 'Offline'}
        </span>
    );
}

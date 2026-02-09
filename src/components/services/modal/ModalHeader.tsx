import React from 'react';
import { Box, X } from 'lucide-react';

interface ModalHeaderProps {
    serviceName: string;
    onClose: () => void;
}

export function ModalHeader({ serviceName, onClose }: ModalHeaderProps) {
    return (
        <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/5 backdrop-blur-md">
            <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2 tracking-tight">
                    <Box className="w-5 h-5 text-purple-400" />
                    Configure & Redeploy
                </h2>
                <p className="text-xs text-muted-foreground mt-1">
                    Updating <strong className="text-white">{serviceName}</strong>. This will replace the specific container.
                </p>
            </div>
            <button 
                onClick={onClose} 
                className="p-2 hover:bg-white/10 rounded-lg transition-colors group"
                title="Close"
            >
                <X className="w-5 h-5 text-muted-foreground group-hover:text-white transition-colors" />
            </button>
        </div>
    );
}

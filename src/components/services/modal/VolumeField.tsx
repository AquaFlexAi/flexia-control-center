import React from 'react';
import { Plus, Trash2 } from 'lucide-react';

interface VolumeFieldProps {
    volumes: string[];
    setVolumes: (volumes: string[]) => void;
}

export function VolumeField({ volumes, setVolumes }: VolumeFieldProps) {
    return (
        <div className="space-y-3">
            <div className="flex justify-between items-center">
                <label className="text-sm font-bold text-white uppercase tracking-wider">Bind Mounts</label>
                <button 
                    type="button" 
                    onClick={() => setVolumes([...volumes, ''])} 
                    className="text-xs text-purple-400 hover:text-purple-300 font-bold flex items-center gap-1 transition-colors bg-purple-500/10 px-2 py-1 rounded-md hover:bg-purple-500/20"
                >
                    <Plus className="w-3 h-3" /> Add Volume
                </button>
            </div>
            <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar pr-2">
                {volumes.map((vol, i) => (
                    <div key={i} className="flex gap-2 group animate-in slide-in-from-left-2 duration-200">
                        <input
                            placeholder="/host/path:/container/path"
                            value={vol}
                            onChange={e => {
                                const newArr = [...volumes];
                                newArr[i] = e.target.value;
                                setVolumes(newArr);
                            }}
                            className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white font-mono placeholder:text-muted-foreground/30 focus:outline-none focus:border-purple-500/50 transition-colors"
                        />
                        <button 
                            type="button" 
                            onClick={() => setVolumes(volumes.filter((_, idx) => idx !== i))} 
                            className="p-2 hover:bg-rose-500/10 rounded-lg transition-colors group/delete"
                        >
                            <Trash2 className="w-4 h-4 text-rose-500/50 group-hover/delete:text-rose-500 transition-colors" />
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}

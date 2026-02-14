"use client";

import React, { useEffect, useRef, useState } from "react";
import mermaid from "mermaid";
import { Loader2, AlertCircle } from "lucide-react";

interface MermaidProps {
    chart: string;
}

export function Mermaid({ chart }: MermaidProps) {
    const ref = useRef<HTMLDivElement>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        mermaid.initialize({
            startOnLoad: false,
            theme: 'dark',
            securityLevel: 'loose',
            fontFamily: 'ui-sans-serif, system-ui, sans-serif',
        });
    }, []);

    useEffect(() => {
        const renderChart = async () => {
            if (!ref.current || !chart) return;
            
            setLoading(true);
            setError(null);
            
            try {
                const id = `mermaid-${Math.random().toString(36).substr(2, 9)}`;
                ref.current.innerHTML = '';
                const { svg } = await mermaid.render(id, chart);
                if (ref.current) {
                    ref.current.innerHTML = svg;
                }
            } catch (err: any) {
                console.error("Mermaid render error:", err);
                setError(err.message || "Failed to render diagram");
            } finally {
                setLoading(false);
            }
        };

        renderChart();
    }, [chart]);

    if (error) {
        return (
            <div className="p-4 border border-red-500/20 bg-red-500/10 rounded-lg text-red-400 text-sm flex items-start gap-2">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <div>
                    <p className="font-semibold mb-1">Failed to render diagram</p>
                    <pre className="text-xs opacity-70 whitespace-pre-wrap">{error}</pre>
                    <pre className="mt-2 text-xs bg-black/20 p-2 rounded text-muted-foreground">{chart}</pre>
                </div>
            </div>
        );
    }

    return (
        <div className="my-8 relative group">
            {loading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/5 z-10">
                    <Loader2 className="w-6 h-6 text-purple-500 animate-spin" />
                </div>
            )}
            <div 
                ref={ref} 
                className="mermaid-chart overflow-x-auto p-4 bg-white/5 border border-white/5 rounded-lg flex justify-center min-h-[100px]"
            />
        </div>
    );
}

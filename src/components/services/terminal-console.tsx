"use client";

import React, { useEffect, useRef } from 'react';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import 'xterm/css/xterm.css';

interface TerminalConsoleProps {
    serviceId: string;
    serviceName: string;
    onClose?: () => void;
}

export default function TerminalConsole({ serviceId, serviceName, onClose }: TerminalConsoleProps) {
    const terminalRef = useRef<HTMLDivElement>(null);
    const xtermRef = useRef<Terminal | null>(null);

    useEffect(() => {
        if (!terminalRef.current) return;

        const term = new Terminal({
            cursorBlink: true,
            theme: {
                background: '#0a0a0a',
                foreground: '#e5e7eb',
                cursor: '#8b5cf6',
                selectionBackground: 'rgba(139, 92, 246, 0.3)',
            },
            fontFamily: '"JetBrains Mono", "Fira Code", monospace',
            fontSize: 13,
        });

        const fitAddon = new FitAddon();
        term.loadAddon(fitAddon);
        term.open(terminalRef.current);
        fitAddon.fit();

        xtermRef.current = term;

        term.writeln(`\x1b[1;35m🚀 FlexIA SSH Proxy v1.0.0\x1b[0m`);
        term.writeln(`Connecting to ${serviceName} [${serviceId}]...`);

        // Simulate connection
        setTimeout(() => {
            term.writeln(`\x1b[1;32m✅ Connected.\x1b[0m`);
            term.write(`\r\nflexia@${serviceName.toLowerCase().replace(/\s+/g, '-')}:~$ `);
        }, 1000);

        term.onData((data) => {
            // Echo for now (simulate local processing)
            if (data === '\r') {
                term.write('\r\nflexia@' + serviceName.toLowerCase().replace(/\s+/g, '-') + ':~$ ');
            } else if (data === '\u007f') { // Backspace
                term.write('\b \b');
            } else {
                term.write(data);
            }
        });

        const handleResize = () => fitAddon.fit();
        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
            term.dispose();
        };
    }, [serviceId, serviceName]);

    return (
        <div className="flex flex-col h-[500px] w-full bg-[#0a0a0a] rounded-2xl border border-white/10 overflow-hidden animate-in zoom-in-95 duration-300 shadow-2xl">
            <div className="flex justify-between items-center px-4 py-3 border-b border-white/5 bg-white/5">
                <div className="flex items-center gap-2">
                    <div className="flex gap-1.5 mr-3">
                        <div className="w-2.5 h-2.5 rounded-full bg-rose-500/50" />
                        <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/50" />
                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/50" />
                    </div>
                    <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">SSH Terminal</span>
                    <span className="text-xs font-bold text-purple-400 font-mono tracking-tighter">@{serviceName.toLowerCase()}</span>
                </div>
                {onClose && (
                    <button
                        onClick={onClose}
                        className="text-muted-foreground hover:text-white transition-colors p-1"
                    >
                        <span className="text-xs font-bold">ESC</span>
                    </button>
                )}
            </div>
            <div ref={terminalRef} className="flex-1 p-4" />
        </div>
    );
}

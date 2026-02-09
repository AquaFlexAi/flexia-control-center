"use client";

import React, { useEffect, useRef, memo } from 'react';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import 'xterm/css/xterm.css';

interface TerminalConsoleProps {
    serviceId: string;
    serviceName: string;
    instanceId?: string;
    node?: string;
    onClose?: () => void;
}

const TerminalConsole = memo(({ serviceId, serviceName, instanceId, node, onClose }: TerminalConsoleProps) => {
    const terminalRef = useRef<HTMLDivElement>(null);
    const xtermRef = useRef<Terminal | null>(null);
    const wsRef = useRef<WebSocket | null>(null);
    const prevProps = useRef({ serviceId, serviceName, instanceId, node });

    useEffect(() => {
        // Debug: Log why re-init happens
        const changes = [];
        if (prevProps.current.serviceId !== serviceId) changes.push(`serviceId: ${prevProps.current.serviceId} -> ${serviceId}`);
        if (prevProps.current.serviceName !== serviceName) changes.push(`serviceName: ${prevProps.current.serviceName} -> ${serviceName}`);
        if (prevProps.current.instanceId !== instanceId) changes.push(`instanceId: ${prevProps.current.instanceId} -> ${instanceId}`);
        if (prevProps.current.node !== node) changes.push(`node: ${prevProps.current.node} -> ${node}`);
        
        if (changes.length > 0) {
            console.debug("[Terminal] Props changed, triggering re-init:", changes.join(', '));
            prevProps.current = { serviceId, serviceName, instanceId, node };
        }

        if (!terminalRef.current) return;
        
        let isUnmounted = false;
        console.debug("[Terminal] Mounting component...", { serviceId, node });

        // Instantiate terminal with padding in theme to avoid container dimension issues
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
            allowProposedApi: true,
            overviewRulerWidth: 0, // Disable to prevent extra rendering overhead
            scrollback: 5000, // Limit scrollback to prevent memory issues
            disableStdin: false,
        });

        const fitAddon = new FitAddon();
        term.loadAddon(fitAddon);
        xtermRef.current = term;

        // Attach Data Listener immediately to ensure no missed events
        // Forward data to WebSocket
        const disposable = term.onData((data) => {
             try {
                if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
                    wsRef.current.send(data);
                }
            } catch (e) {
                // Ignore write errors on disposed terminal
            }
        });

        // Robust fit function
        const safeFit = () => {
            if (isUnmounted || !terminalRef.current || !xtermRef.current) return;
            
            // Critical: Check dimensions before fitting
            const currentTerm = xtermRef.current;
            
            // Check if terminal is actually mounted in DOM
            // @ts-ignore - element check is better
            if (!currentTerm.element?.isConnected || !terminalRef.current.isConnected) {
                return;
            }

            if (terminalRef.current.clientWidth === 0 || terminalRef.current.clientHeight === 0) {
                return;
            }

            try {
                fitAddon.fit();
                console.debug("[Terminal] Fit complete", { cols: currentTerm.cols, rows: currentTerm.rows });
            } catch (e) {
                // Suppress 'dimensions' error which is common during resize/unmount
                console.warn("[Terminal] Fit warning (safe to ignore):", e);
            }
        };

        let isOpened = false;
        let initTimer: NodeJS.Timeout | null = null;

        // Initialize terminal only when container has dimensions
        const initTerminal = () => {
             if (isUnmounted || !terminalRef.current || isOpened) return;
             
             // Double check connection
             if (!terminalRef.current.isConnected) return;

             const width = terminalRef.current.clientWidth;
             const height = terminalRef.current.clientHeight;

             if (width > 0 && height > 0) {
                 try {
                    console.debug("[Terminal] Opening terminal...", { width, height });
                    term.open(terminalRef.current);
                    
                    // Force a small delay to ensure renderer is ready before fitting
                    // and make visible only after fit
                    requestAnimationFrame(() => {
                        if (isUnmounted) return;
                        
                        // Initial fit
                        safeFit();
                        isOpened = true;
                        
                        // Make visible
                        if (terminalRef.current) {
                            terminalRef.current.style.opacity = "1";
                        }
                        
                        term.writeln(`\x1b[1;35m🚀 FlexIA SSH Proxy v1.0.0\x1b[0m`);
                        const target = instanceId ? `instance ${instanceId.substring(0, 8)}...` : `service ${serviceId}...`;
                        const location = node ? ` on ${node}` : '';
                        term.writeln(`Connecting to ${serviceName} [${target}]${location}...`);

                        // Connect to WebSocket
                        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
                        const wsUrl = `${protocol}//${window.location.host}/api/ws/terminal?serviceId=${serviceId}&serviceName=${serviceName}&instanceId=${instanceId || ''}&node=${node || ''}`;

                        const ws = new WebSocket(wsUrl);
                        wsRef.current = ws;

                        ws.onopen = () => {
                             if (isUnmounted) {
                                 ws.close();
                                 return;
                             }
                             // term.writeln('\x1b[32m✔ Connected to Backend.\x1b[0m');
                             // Backend will send confirmation message
                        };

                        ws.onmessage = (event) => {
                             if (isUnmounted) return;
                             if (typeof event.data === 'string') {
                                 term.write(event.data);
                             }
                        };

                        ws.onclose = (event) => {
                             if (isUnmounted) return;
                             if (event.code !== 1000) {
                                 term.writeln(`\r\n\x1b[1;31m❌ Connection Closed: ${event.reason || 'End of Session'}\x1b[0m`);
                             }
                        };

                        ws.onerror = (err) => {
                             if (isUnmounted) return;
                             term.writeln(`\r\n\x1b[1;31m❌ Connection Error. Is the backend running?\x1b[0m`);
                        };
                    });

                 } catch (err) {
                     console.error("Terminal initialization failed:", err);
                 }
             }
        };
        
        // Use ResizeObserver to detect when container is ready
        const resizeObserver = new ResizeObserver((entries) => {
             if (isUnmounted) return;
             for (const entry of entries) {
                 if (entry.contentRect.width > 0 && entry.contentRect.height > 0) {
                     if (!isOpened) {
                         if (initTimer) clearTimeout(initTimer);
                         initTimer = setTimeout(() => {
                             if (!isUnmounted) requestAnimationFrame(initTerminal);
                         }, 100);
                     } else {
                         // Debounce fit calls
                         if (initTimer) clearTimeout(initTimer);
                         initTimer = setTimeout(() => {
                             if (!isUnmounted) requestAnimationFrame(safeFit);
                         }, 100);
                     }
                 }
             }
        });

        if (terminalRef.current) {
            resizeObserver.observe(terminalRef.current);
        }

        return () => {
            console.debug("[Terminal] Cleaning up...");
            isUnmounted = true;
            if (initTimer) clearTimeout(initTimer);
            resizeObserver.disconnect();
            disposable.dispose();
            
            // Critical: Hide element to prevent render artifacts
            if (terminalRef.current) {
                terminalRef.current.style.opacity = "0";
            }
            
            // Dispose safely
            const termToDispose = xtermRef.current;
            xtermRef.current = null; // Prevent any further access
            
            if (termToDispose) {
                try {
                    termToDispose.dispose();
                } catch (e) {
                    console.warn("[Terminal] Dispose error (ignored):", e);
                }
            }

            if (wsRef.current) {
                wsRef.current.close();
                wsRef.current = null;
            }
        };
    }, [serviceId, serviceName, instanceId, node]);

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
                    <span className="text-xs font-bold text-purple-400 font-mono tracking-tighter">
                        @{serviceName.toLowerCase()}
                        {instanceId && <span className="text-white/30 ml-1">:{instanceId.substring(0, 8)}</span>}
                    </span>
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
            {/* Remove padding to prevent xterm fit calculation errors. The terminal will fill this area. */}
            <div 
                ref={terminalRef} 
                className="flex-1 transition-opacity duration-200" 
                style={{ opacity: 0 }} 
            />
        </div>
    );
});

TerminalConsole.displayName = 'TerminalConsole';

export default TerminalConsole;

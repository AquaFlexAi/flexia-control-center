"use client";

import React, { useEffect, useRef } from "react";
import { Copy, Check } from "lucide-react";
import { Mermaid } from "./Mermaid";
import { createRoot } from "react-dom/client";

/**
 * Client component that hydrates SSR-rendered HTML:
 * 1. Attaches copy buttons to code blocks
 * 2. Renders Mermaid diagrams from `language-mermaid` code blocks
 */
export function DocInteractivity({ children }: { children: React.ReactNode }) {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!containerRef.current) return;

        // ─── Copy Buttons ─────────────────────────────────────────
        const codeBlocks = containerRef.current.querySelectorAll("pre");
        const cleanupFns: (() => void)[] = [];

        codeBlocks.forEach((pre) => {
            // Skip mermaid blocks
            const codeEl = pre.querySelector("code");
            if (!codeEl) return;
            if (codeEl.classList.contains("language-mermaid")) return;

            // Don't add duplicate buttons
            if (pre.querySelector("[data-copy-btn]")) return;

            // Wrap in a relative container
            pre.style.position = "relative";

            // Detect language from class
            const langMatch = codeEl.className.match(/language-(\w+)/);
            const lang = langMatch ? langMatch[1] : "";

            // Create toolbar
            const toolbar = document.createElement("div");
            toolbar.setAttribute("data-copy-btn", "true");
            toolbar.className = "code-toolbar";
            toolbar.innerHTML = `
                <span class="code-lang">${lang}</span>
                <button class="copy-btn" title="Copy code">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
                </button>
            `;

            pre.insertBefore(toolbar, pre.firstChild);

            const btn = toolbar.querySelector(".copy-btn")!;
            const handler = () => {
                const text = codeEl.textContent || "";
                navigator.clipboard.writeText(text).then(() => {
                    btn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4ade80" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`;
                    setTimeout(() => {
                        btn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>`;
                    }, 2000);
                });
            };
            btn.addEventListener("click", handler);
            cleanupFns.push(() => btn.removeEventListener("click", handler));
        });

        // ─── Mermaid Diagrams ─────────────────────────────────────
        const mermaidBlocks = containerRef.current.querySelectorAll(
            "code.language-mermaid"
        );
        mermaidBlocks.forEach((codeEl) => {
            const chart = codeEl.textContent || "";
            const pre = codeEl.parentElement;
            if (!pre) return;

            // Create a wrapper and render the Mermaid component into it
            const wrapper = document.createElement("div");
            wrapper.className = "mermaid-ssr-wrapper";
            pre.parentElement?.replaceChild(wrapper, pre);

            const root = createRoot(wrapper);
            root.render(<Mermaid chart={chart} />);
            cleanupFns.push(() => root.unmount());
        });

        return () => {
            cleanupFns.forEach((fn) => fn());
        };
    }, []);

    return <div ref={containerRef}>{children}</div>;
}

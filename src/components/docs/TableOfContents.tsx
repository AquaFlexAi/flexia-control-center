"use client";

import React, { useEffect, useState, useCallback } from "react";
import { cn } from "@/lib/utils";

interface TocItem {
    id: string;
    text: string;
    level: number;
}

interface TableOfContentsProps {
    headings: TocItem[];
}

export function TableOfContents({ headings }: TableOfContentsProps) {
    const [activeId, setActiveId] = useState<string>("");

    // Scroll-spy via IntersectionObserver
    useEffect(() => {
        const ids = headings.map((h) => h.id);
        const elements = ids
            .map((id) => document.getElementById(id))
            .filter(Boolean) as HTMLElement[];

        if (elements.length === 0) return;

        const observer = new IntersectionObserver(
            (entries) => {
                // Find the first heading that is intersecting (most visible near top)
                const visible = entries
                    .filter((e) => e.isIntersecting)
                    .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);

                if (visible.length > 0) {
                    setActiveId(visible[0].target.id);
                }
            },
            {
                rootMargin: "-80px 0px -70% 0px",
                threshold: 0,
            }
        );

        elements.forEach((el) => observer.observe(el));
        return () => observer.disconnect();
    }, [headings]);

    const handleClick = useCallback((e: React.MouseEvent, id: string) => {
        e.preventDefault();
        const el = document.getElementById(id);
        if (el) {
            el.scrollIntoView({ behavior: "smooth", block: "start" });
            setActiveId(id);
        }
    }, []);

    if (headings.length === 0) return null;

    // Get the minimum heading level to normalize indentation
    const minLevel = Math.min(...headings.map((h) => h.level));

    return (
        <nav className="hidden xl:block w-60 shrink-0 border-l border-white/5 sticky top-0 h-[calc(100vh-8rem)] overflow-y-auto py-8 px-6">
            <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-4">
                On this page
            </h4>
            <ul className="space-y-1 text-[13px]">
                {headings.map((heading) => {
                    const isActive = activeId === heading.id;
                    const indent = (heading.level - minLevel) * 14;

                    return (
                        <li key={heading.id}>
                            <a
                                href={`#${heading.id}`}
                                className={cn(
                                    "block py-1 transition-all duration-200 border-l-2 pl-3",
                                    isActive
                                        ? "text-purple-400 font-medium border-purple-500"
                                        : "text-muted-foreground/70 hover:text-white border-transparent hover:border-white/20"
                                )}
                                style={{ marginLeft: `${indent}px` }}
                                onClick={(e) => handleClick(e, heading.id)}
                            >
                                {heading.text}
                            </a>
                        </li>
                    );
                })}
            </ul>
        </nav>
    );
}

import React from "react";
import { Clock, FileText, Calendar, Tag, Layers } from "lucide-react";
import { DocInteractivity } from "./DocInteractivity";
import type { TocHeading } from "@/lib/docs";

// VS Code Dark theme syntax highlighting
import 'highlight.js/styles/github-dark.css';

interface DocViewerProps {
    htmlContent: string;
    frontmatter?: Record<string, any>;
    readingTime?: number;
    wordCount?: number;
}

// ─── Category Colors ──────────────────────────────────────────────────────────

const CATEGORY_COLORS: Record<string, string> = {
    Core: "bg-blue-500/15 text-blue-400 border-blue-500/30",
    Network: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    Features: "bg-purple-500/15 text-purple-400 border-purple-500/30",
    API: "bg-amber-500/15 text-amber-400 border-amber-500/30",
    Project: "bg-cyan-500/15 text-cyan-400 border-cyan-500/30",
    Reports: "bg-pink-500/15 text-pink-400 border-pink-500/30",
};

// ─── DocViewer (Server Component) ─────────────────────────────────────────────

export function DocViewer({ htmlContent, frontmatter, readingTime, wordCount }: DocViewerProps) {
    const categoryClass = CATEGORY_COLORS[frontmatter?.category] || "bg-white/10 text-white/70 border-white/10";

    // Parse keywords
    const keywords: string[] = Array.isArray(frontmatter?.keywords)
        ? frontmatter.keywords
        : typeof frontmatter?.keywords === 'string'
            ? frontmatter.keywords.split(',').map((k: string) => k.trim())
            : [];

    // Format date
    const lastUpdated = frontmatter?.last_updated
        ? new Date(frontmatter.last_updated).toLocaleDateString('en-US', {
            year: 'numeric', month: 'long', day: 'numeric'
        })
        : null;

    return (
        <article className="animate-in fade-in duration-500 pb-20">
            {/* ── Frontmatter Metadata Card ─────────────────────────── */}
            {frontmatter && Object.keys(frontmatter).length > 0 && (
                <div className="mb-10 p-6 bg-gradient-to-br from-white/[0.06] to-white/[0.02] border border-white/10 rounded-2xl backdrop-blur-sm">
                    {/* Title */}
                    <h1 className="text-3xl font-extrabold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-white via-white to-white/50">
                        {frontmatter.title || 'Documentation'}
                    </h1>

                    {/* Description */}
                    {frontmatter.description && (
                        <p className="text-sm text-muted-foreground mb-5 max-w-2xl leading-relaxed">
                            {frontmatter.description}
                        </p>
                    )}

                    {/* Metadata Row */}
                    <div className="flex flex-wrap items-center gap-3 mb-4">
                        {/* Category Pill */}
                        {frontmatter.category && (
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full border ${categoryClass}`}>
                                <Layers className="w-3 h-3" />
                                {frontmatter.category}
                            </span>
                        )}

                        {/* Reading Time */}
                        {readingTime && (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-full bg-white/5 text-muted-foreground border border-white/5">
                                <Clock className="w-3 h-3" />
                                {readingTime} min read
                            </span>
                        )}

                        {/* Word Count */}
                        {wordCount && (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-full bg-white/5 text-muted-foreground border border-white/5">
                                <FileText className="w-3 h-3" />
                                {wordCount.toLocaleString()} words
                            </span>
                        )}

                        {/* Last Updated */}
                        {lastUpdated && (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-full bg-white/5 text-muted-foreground border border-white/5">
                                <Calendar className="w-3 h-3" />
                                {lastUpdated}
                            </span>
                        )}
                    </div>

                    {/* Keywords */}
                    {keywords.length > 0 && (
                        <div className="flex flex-wrap items-center gap-2">
                            <Tag className="w-3 h-3 text-muted-foreground/60" />
                            {keywords.map((kw, i) => (
                                <span
                                    key={i}
                                    className="px-2 py-0.5 text-[11px] rounded-md bg-purple-500/10 text-purple-300 border border-purple-500/15 font-medium"
                                >
                                    {kw}
                                </span>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* ── Rendered Markdown Content ─────────────────────────── */}
            <DocInteractivity>
                <div
                    className="doc-prose"
                    dangerouslySetInnerHTML={{ __html: htmlContent }}
                />
            </DocInteractivity>
        </article>
    );
}

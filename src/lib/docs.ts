import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkRehype from 'remark-rehype';
import rehypeRaw from 'rehype-raw';
import rehypeSlug from 'rehype-slug';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';
import rehypeHighlight from 'rehype-highlight';
import rehypeStringify from 'rehype-stringify';

const DOCS_ROOT = path.join(process.cwd(), 'docs');

// ─── Types ────────────────────────────────────────────────────────────────────

export interface DocNode {
    name: string;
    path: string;
    type: 'file' | 'directory';
    children?: DocNode[];
    size?: number;
}

export interface TocHeading {
    id: string;
    text: string;
    level: number;
}

export interface DocContent {
    slug: string;
    frontmatter: Record<string, any>;
    content: string;       // raw markdown (kept for fallback)
    htmlContent: string;   // pre-rendered HTML
    headings: TocHeading[];
    readingTime: number;   // minutes
    wordCount: number;
    metadata: {
        size: number;
        lastModified: Date;
    };
}

// ─── Tree Builder ─────────────────────────────────────────────────────────────

export function getDocsTree(): DocNode[] {
    return buildTree(DOCS_ROOT);
}

function buildTree(dirPath: string, relativePath: string = ''): DocNode[] {
    if (!fs.existsSync(dirPath)) return [];

    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    const nodes: DocNode[] = [];

    const sorted = entries.sort((a, b) => {
        if (a.isDirectory() && !b.isDirectory()) return -1;
        if (!a.isDirectory() && b.isDirectory()) return 1;
        return a.name.localeCompare(b.name);
    });

    for (const entry of sorted) {
        const entryRelPath = relativePath ? `${relativePath}/${entry.name}` : entry.name;
        const fullPath = path.join(dirPath, entry.name);

        if (entry.isDirectory()) {
            if (entry.name.startsWith('.')) continue;
            const children = buildTree(fullPath, entryRelPath);
            if (children.length > 0) {
                nodes.push({ name: entry.name, path: entryRelPath, type: 'directory', children });
            }
        } else if (entry.name.endsWith('.md')) {
            const stat = fs.statSync(fullPath);
            nodes.push({ name: entry.name, path: entryRelPath, type: 'file', size: stat.size });
        }
    }

    return nodes;
}

// ─── GitHub Alerts Pre-processor ──────────────────────────────────────────────

const ALERT_TYPES: Record<string, { icon: string; label: string; cssClass: string }> = {
    'NOTE': { icon: 'ℹ️', label: 'Note', cssClass: 'alert-note' },
    'TIP': { icon: '💡', label: 'Tip', cssClass: 'alert-tip' },
    'IMPORTANT': { icon: '⚠️', label: 'Important', cssClass: 'alert-important' },
    'WARNING': { icon: '🚨', label: 'Warning', cssClass: 'alert-warning' },
    'CAUTION': { icon: '🛑', label: 'Caution', cssClass: 'alert-caution' },
};

/**
 * Transforms GitHub-style `> [!TYPE]` alerts into HTML callout divs
 * before markdown parsing, so rehype-raw can pick them up.
 */
function preprocessGitHubAlerts(markdown: string): string {
    // Match blockquotes starting with > [!TYPE]
    // Captures the type and all subsequent > lines
    const alertRegex = /^> \[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]\s*\n((?:>.*(?:\n|$))*)/gm;

    return markdown.replace(alertRegex, (_match, type: string, bodyLines: string) => {
        const config = ALERT_TYPES[type];
        if (!config) return _match;

        // Strip leading > from each body line
        const body = bodyLines
            .split('\n')
            .map((line: string) => line.replace(/^>\s?/, ''))
            .join('\n')
            .trim();

        return `<div class="github-alert ${config.cssClass}">
<div class="github-alert-title">${config.icon} ${config.label}</div>
<div class="github-alert-body">

${body}

</div>
</div>\n`;
    });
}

// ─── Heading Extractor ────────────────────────────────────────────────────────

function extractHeadings(markdown: string): TocHeading[] {
    const headings: TocHeading[] = [];
    const headingRegex = /^(#{1,6})\s+(.+)$/gm;
    let match;

    while ((match = headingRegex.exec(markdown)) !== null) {
        const level = match[1].length;
        const rawText = match[2].trim();
        // Remove emoji prefixes for cleaner TOC text
        const text = rawText.replace(/^[\u{1F000}-\u{1FFFF}\u{2600}-\u{27BF}\u{FE00}-\u{FE0F}\u{1F900}-\u{1F9FF}]\s*/u, '');
        // Generate slug matching rehype-slug algorithm
        const id = rawText
            .toLowerCase()
            .replace(/[^\w\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '');

        if (level >= 1 && level <= 3) {
            headings.push({ id, text: text || rawText, level });
        }
    }

    return headings;
}

// ─── Reading Time ─────────────────────────────────────────────────────────────

function calculateReadingTime(text: string): { minutes: number; wordCount: number } {
    // Strip markdown syntax for word count
    const stripped = text
        .replace(/```[\s\S]*?```/g, '')       // fenced code
        .replace(/`[^`]+`/g, '')               // inline code
        .replace(/!\[.*?\]\(.*?\)/g, '')       // images
        .replace(/\[([^\]]+)\]\(.*?\)/g, '$1') // links → text
        .replace(/[#*_~>|-]/g, '')             // md syntax
        .replace(/\s+/g, ' ')
        .trim();

    const words = stripped.split(/\s+/).filter(Boolean);
    const wordCount = words.length;
    const minutes = Math.max(1, Math.ceil(wordCount / 220));

    return { minutes, wordCount };
}

// ─── Unified SSR Pipeline ─────────────────────────────────────────────────────

async function renderMarkdown(rawContent: string): Promise<string> {
    // Pre-process GitHub alerts into HTML before unified pipeline
    const preprocessed = preprocessGitHubAlerts(rawContent);

    const processor = unified()
        .use(remarkParse)
        .use(remarkGfm)
        .use(remarkRehype, { allowDangerousHtml: true })
        .use(rehypeRaw)
        .use(rehypeSlug)
        .use(rehypeAutolinkHeadings, { behavior: 'wrap' })
        .use(rehypeHighlight, { detect: true, ignoreMissing: true })
        .use(rehypeStringify);

    const result = await processor.process(preprocessed);
    return String(result);
}

// ─── Public API ──────────────────────────────────────────────────────────────

export async function getDocContent(slug: string[]): Promise<DocContent | null> {
    const slugPath = slug.join('/');

    if (slugPath.includes('..')) return null;

    const fullPath = path.join(DOCS_ROOT, slugPath);

    // Try exact match → append .md → index.md → README.md
    let targetPath = fullPath;
    if (!fs.existsSync(targetPath)) {
        targetPath = `${fullPath}.md`;
    }
    if (!fs.existsSync(targetPath) && fs.existsSync(fullPath) && fs.statSync(fullPath).isDirectory()) {
        targetPath = path.join(fullPath, 'index.md');
        if (!fs.existsSync(targetPath)) {
            targetPath = path.join(fullPath, 'README.md');
        }
    }

    if (!fs.existsSync(targetPath)) return null;

    const fileContent = fs.readFileSync(targetPath, 'utf8');
    const { data: frontmatter, content } = matter(fileContent);
    const stat = fs.statSync(targetPath);

    // SSR pipeline
    const htmlContent = await renderMarkdown(content);
    const headings = extractHeadings(content);
    const { minutes: readingTime, wordCount } = calculateReadingTime(content);

    return {
        slug: slugPath,
        frontmatter,
        content,
        htmlContent,
        headings,
        readingTime,
        wordCount,
        metadata: {
            size: stat.size,
            lastModified: stat.mtime,
        },
    };
}

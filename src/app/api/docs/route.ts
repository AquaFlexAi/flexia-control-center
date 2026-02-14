import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const DOCS_ROOT = path.join(process.cwd(), 'docs');

interface DocNode {
    name: string;
    path: string;       // relative path from docs root
    type: 'file' | 'directory';
    children?: DocNode[];
    size?: number;
}

function buildTree(dirPath: string, relativePath: string = ''): DocNode[] {
    if (!fs.existsSync(dirPath)) return [];

    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    const nodes: DocNode[] = [];

    // Sort: directories first, then files, alphabetically
    const sorted = entries.sort((a, b) => {
        if (a.isDirectory() && !b.isDirectory()) return -1;
        if (!a.isDirectory() && b.isDirectory()) return 1;
        return a.name.localeCompare(b.name);
    });

    for (const entry of sorted) {
        const entryRelPath = relativePath ? `${relativePath}/${entry.name}` : entry.name;
        const fullPath = path.join(dirPath, entry.name);

        if (entry.isDirectory()) {
            // Skip hidden dirs and DDD
            if (entry.name.startsWith('.')) continue;

            const children = buildTree(fullPath, entryRelPath);
            if (children.length > 0) {
                nodes.push({
                    name: entry.name,
                    path: entryRelPath,
                    type: 'directory',
                    children,
                });
            }
        } else if (entry.name.endsWith('.md')) {
            const stat = fs.statSync(fullPath);
            nodes.push({
                name: entry.name,
                path: entryRelPath,
                type: 'file',
                size: stat.size,
            });
        }
    }

    return nodes;
}

export async function GET(request: NextRequest) {
    try {
        const tree = buildTree(DOCS_ROOT);

        return NextResponse.json({
            root: 'docs',
            tree,
            totalFiles: countFiles(tree),
        });
    } catch (error: any) {
        console.error('[Docs API] Error:', error.message);
        return NextResponse.json({ error: 'Failed to read docs directory' }, { status: 500 });
    }
}

function countFiles(nodes: DocNode[]): number {
    let count = 0;
    for (const node of nodes) {
        if (node.type === 'file') count++;
        if (node.children) count += countFiles(node.children);
    }
    return count;
}

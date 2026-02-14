import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

const DOCS_ROOT = path.join(process.cwd(), 'docs');

export async function GET(
    request: NextRequest,
    props: { params: Promise<{ slug: string[] }> }
) {
    try {
        const params = await props.params;
        const slugPath = params.slug.join('/');

        // Security check: prevent directory traversal
        if (slugPath.includes('..')) {
            return NextResponse.json({ error: 'Invalid path' }, { status: 400 });
        }

        const fullPath = path.join(DOCS_ROOT, `${slugPath}`);

        // Try exact match or append .md
        let targetPath = fullPath;
        if (!fs.existsSync(targetPath)) {
            targetPath = `${fullPath}.md`;
        }

        if (!fs.existsSync(targetPath)) {
            return NextResponse.json({ error: 'Document not found' }, { status: 404 });
        }

        const fileContent = fs.readFileSync(targetPath, 'utf8');
        const { data: frontmatter, content } = matter(fileContent);

        // Get basic stats
        const stat = fs.statSync(targetPath);

        return NextResponse.json({
            path: slugPath,
            frontmatter,
            content,
            metadata: {
                size: stat.size,
                lastModified: stat.mtime
            }
        });
    } catch (error: any) {
        console.error(`[Docs API] Error reading document:`, error.message);
        return NextResponse.json({ error: 'Failed to read document' }, { status: 500 });
    }
}

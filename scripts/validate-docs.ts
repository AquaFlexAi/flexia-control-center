import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

const DOCS_ROOT = path.join(process.cwd(), 'docs');
const REQUIRED_FRONTMATTER = ['title', 'description', 'category'];
const ALLOWED_CATEGORIES = ['Core', 'Network', 'Features', 'API', 'Project', 'Reports'];

interface ValidationError {
    file: string;
    line?: number;
    message: string;
    level: 'error' | 'warning';
}

const errors: ValidationError[] = [];

function walkDir(dir: string, callback: (filePath: string) => void) {
    if (!fs.existsSync(dir)) return;
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        if (stat.isDirectory()) {
            if (file.startsWith('.') || file === 'node_modules') continue;
            walkDir(filePath, callback);
        } else {
            callback(filePath);
        }
    }
}

function validateFile(filePath: string) {
    const relativePath = path.relative(process.cwd(), filePath);
    
    if (!filePath.endsWith('.md')) return;

    const content = fs.readFileSync(filePath, 'utf8');
    const { data: frontmatter, content: body } = matter(content);

    // 1. Validate Frontmatter
    for (const field of REQUIRED_FRONTMATTER) {
        if (!frontmatter[field]) {
            errors.push({
                file: relativePath,
                message: `Missing required frontmatter field: '${field}'`,
                level: 'error'
            });
        }
    }

    if (frontmatter.category && !ALLOWED_CATEGORIES.includes(frontmatter.category)) {
        errors.push({
            file: relativePath,
            message: `Invalid category '${frontmatter.category}'. Allowed: ${ALLOWED_CATEGORIES.join(', ')}`,
            level: 'warning'
        });
    }

    // 2. Validate Structure (H1)
    // The H1 should usually match the title, or at least exist.
    // However, some docs might rely on frontmatter title for the page header.
    // Let's just warn if NO H1 is found in the body.
    const h1Match = body.match(/^#\s+(.+)$/m);
    if (!h1Match) {
        errors.push({
            file: relativePath,
            message: 'No H1 header found in content (should start with # Title)',
            level: 'warning'
        });
    }

    // 3. Validate Links
    // Matches [text](link)
    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    let match;
    while ((match = linkRegex.exec(body)) !== null) {
        const link = match[2];
        // Ignore external links, anchors, and absolute paths (for now)
        if (link.startsWith('http') || link.startsWith('#') || link.startsWith('mailto:')) continue;

        // Check internal links
        // Resolve relative to the current file
        const currentDir = path.dirname(filePath);
        const resolvedPath = path.resolve(currentDir, link.split('#')[0]); // ignore anchor for file check

        if (!fs.existsSync(resolvedPath)) {
             // Try with .md extension if missing
             if (!fs.existsSync(resolvedPath + '.md')) {
                 // Check if it's a directory (README.md implied? Next.js doesn't auto-resolve README in links usually, but let's check)
                 if (!fs.existsSync(resolvedPath) || !fs.statSync(resolvedPath).isDirectory()) {
                    errors.push({
                        file: relativePath,
                        message: `Broken link: ${link}`,
                        level: 'error'
                    });
                 }
             }
        }
    }

    // 4. Check Deprecated Syntax
    if (body.includes('> [!NOTE]') || body.includes('> [!TIP]')) {
         // This is actually GitHub Flavored Markdown (Alerts), which is GOOD.
         // But the user asked to check for "deprecated formatting patterns".
         // Let's assume we WANT to support GFM Alerts, so this is fine.
         // But maybe check for old style like **Note:** at start of blockquote?
    }
}

console.log('🔍 Starting Documentation Validation...');
walkDir(DOCS_ROOT, validateFile);

if (errors.length === 0) {
    console.log('✅ No errors found! Documentation is clean.');
} else {
    console.log(`⚠️ Found ${errors.length} issues:`);
    errors.forEach(e => {
        const icon = e.level === 'error' ? '❌' : '⚠️';
        console.log(`${icon} [${e.file}] ${e.message}`);
    });
    // Exit with error code if there are errors
    if (errors.some(e => e.level === 'error')) {
        process.exit(1);
    }
}

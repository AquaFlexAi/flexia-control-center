import React from 'react';
import { getDocsTree } from '@/lib/docs';
import { DocsLayoutShell } from '@/components/docs/DocsLayoutShell';

export default function DocsLayout({ children }: { children: React.ReactNode }) {
    const tree = getDocsTree();

    return (
        <DocsLayoutShell tree={tree}>
            {children}
        </DocsLayoutShell>
    );
}

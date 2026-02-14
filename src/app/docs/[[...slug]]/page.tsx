import React from 'react';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { getDocContent } from '@/lib/docs';
import { DocViewer } from '@/components/docs/DocViewer';
import { ProgressDashboard } from '@/components/docs/ProgressDashboard';
import { TableOfContents } from '@/components/docs/TableOfContents';

interface PageProps {
    params: Promise<{ slug?: string[] }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { slug } = await params;

    if (!slug || slug.length === 0) {
        return {
            title: 'Documentation | FlexIA Control Center',
            description: 'Project documentation, architecture, and progress tracking.',
        };
    }

    const doc = await getDocContent(slug);
    if (!doc) return { title: 'Not Found' };

    return {
        title: `${doc.frontmatter.title || 'Doc'} | FlexIA Docs`,
        description: doc.frontmatter.description || 'FlexIA Documentation',
        keywords: doc.frontmatter.keywords,
        openGraph: {
            title: doc.frontmatter.title,
            description: doc.frontmatter.description,
            type: 'article',
            publishedTime: doc.frontmatter.last_updated,
            tags: Array.isArray(doc.frontmatter.keywords)
                ? doc.frontmatter.keywords
                : (typeof doc.frontmatter.keywords === 'string' ? doc.frontmatter.keywords.split(',') : []),
        },
        twitter: {
            card: 'summary_large_image',
            title: doc.frontmatter.title,
            description: doc.frontmatter.description,
        }
    };
}

export default async function DocPage({ params }: PageProps) {
    const { slug } = await params;

    // Default view (Dashboard)
    if (!slug || slug.length === 0) {
        return (
            <div className="p-8 max-w-4xl mx-auto animate-in fade-in duration-500">
                <div className="mb-12 text-center">
                    <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-purple-400 to-pink-600 bg-clip-text text-transparent">
                        FlexIA Documentation
                    </h1>
                    <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                        Comprehensive guides, architecture details, and progress tracking for the FlexIA ecosystem.
                    </p>
                </div>
                <ProgressDashboard />
            </div>
        );
    }

    const doc = await getDocContent(slug);

    if (!doc) {
        notFound();
    }

    return (
        <div className="flex gap-0 max-w-full">
            {/* Main content */}
            <div className="flex-1 min-w-0 p-8 max-w-4xl mx-auto">
                <DocViewer
                    htmlContent={doc.htmlContent}
                    frontmatter={doc.frontmatter}
                    readingTime={doc.readingTime}
                    wordCount={doc.wordCount}
                />
            </div>

            {/* Table of Contents — right sidebar */}
            {doc.headings.length > 1 && (
                <TableOfContents headings={doc.headings} />
            )}
        </div>
    );
}

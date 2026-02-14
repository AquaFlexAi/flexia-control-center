"use client";

import React from "react";
import Link from "next/link";
import {
    ChevronRight,
    ChevronDown,
    FileText,
    Folder,
    FolderOpen
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface DocNode {
    name: string;
    path: string;
    type: 'file' | 'directory';
    children?: DocNode[];
}

interface DocTreeProps {
    data: DocNode[];
    activePath?: string;
    onSelect?: (path: string) => void;
    level?: number;
}

export function DocTree({ data, activePath, onSelect, level = 0 }: DocTreeProps) {
    // Basic sorting: folders first, then files
    const sortedData = [...data].sort((a, b) => {
        if (a.type === b.type) return a.name.localeCompare(b.name);
        return a.type === 'directory' ? -1 : 1;
    });

    return (
        <div className="space-y-0.5 select-none">
            {sortedData.map((node) => (
                <TreeNode
                    key={node.path}
                    node={node}
                    activePath={activePath}
                    onSelect={onSelect}
                    level={level}
                />
            ))}
        </div>
    );
}

function TreeNode({ node, activePath, onSelect, level }: {
    node: DocNode;
    activePath?: string;
    onSelect?: (path: string) => void;
    level: number;
}) {
    const [isOpen, setIsOpen] = React.useState(false);

    // Auto-expand if a child is active
    React.useEffect(() => {
        // Check if activePath starts with directory path
        // e.g. node.path = "core", activePath = "core/architecture.md"
        if (activePath && activePath.startsWith(node.path + '/')) {
            setIsOpen(true);
        }
    }, [activePath, node.path]);

    const isFile = node.type === 'file';
    // Match active path: "core/architecture.md" === "core/architecture.md"
    const isActive = activePath === node.path;
    const paddingLeft = `${level * 12 + 12}px`;

    const handleClick = (e: React.MouseEvent) => {
        if (!isFile) {
            e.preventDefault();
            setIsOpen(!isOpen);
        } else if (onSelect) {
            onSelect(node.path);
        }
    };

    const content = (
        <div
            className={cn(
                "flex items-center gap-2 py-1.5 px-2 transition-colors text-sm rounded-md mx-1",
                isActive
                    ? "bg-purple-500/10 text-purple-400 font-medium"
                    : "text-muted-foreground hover:bg-white/5 hover:text-white",
                !isFile && "cursor-pointer"
            )}
            style={{ paddingLeft }}
            onClick={!isFile ? handleClick : undefined}
        >
            {/* Icon */}
            <span className="opacity-70 shrink-0">
                {isFile ? (
                    <FileText className="w-4 h-4" />
                ) : isOpen ? (
                    <FolderOpen className="w-4 h-4 text-amber-400" />
                ) : (
                    <Folder className="w-4 h-4 text-amber-500/80" />
                )}
            </span>

            {/* Name */}
            <span className="truncate">{node.name.replace('.md', '').replace(/-/g, ' ')}</span>

            {/* Chevron for Folders */}
            {!isFile && (
                <span className="ml-auto opacity-50">
                    {isOpen ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                </span>
            )}
        </div>
    );

    return (
        <div>
            {isFile ? (
                <Link 
                    href={`/docs/${node.path.replace('.md', '')}`} 
                    className="block"
                    onClick={() => onSelect?.(node.path)}
                >
                    {content}
                </Link>
            ) : (
                content
            )}

            {/* Children */}
            <AnimatePresence>
                {!isFile && isOpen && node.children && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2, ease: "easeInOut" }}
                        className="overflow-hidden"
                    >
                        <div className="border-l border-white/5 ml-4">
                            <DocTree
                                data={node.children}
                                activePath={activePath}
                                onSelect={onSelect}
                                level={level + 1}
                            />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface GlassCardProps {
    children: React.ReactNode;
    className?: string;
    delay?: number;
    onClick?: () => void;
}

export function GlassCard({ children, className, delay = 0, onClick }: GlassCardProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay }}
            className={cn(
                "backdrop-blur-xl bg-slate-900/40 border border-slate-700/50 rounded-2xl p-6 shadow-xl",
                className
            )}
            onClick={onClick}
        >
            {children}
        </motion.div>
    );
}

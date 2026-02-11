'use client';

import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PlanProps {
    id: string;
    label: string;
    price: string;
    period: string;
    description: string;
    cta: string;
    features: string[];
}

interface PlanCardProps {
    plan: PlanProps;
    currentTier: string;
    onUpgrade: (tier: string) => void;
}

export function PlanCard({ plan, currentTier, onUpgrade }: PlanCardProps) {
    const isCurrent = currentTier === plan.id;
    const isPopular = plan.id === 'pro';

    return (
        <motion.div
            whileHover={{ y: -5 }}
            className={cn(
                "relative p-6 rounded-2xl border flex flex-col h-full transition-all duration-300",
                isCurrent
                    ? 'bg-slate-800/50 border-slate-600 shadow-lg'
                    : isPopular
                        ? 'bg-gradient-to-b from-indigo-900/20 to-slate-900/40 border-indigo-500/50 shadow-indigo-500/10 shadow-2xl'
                        : 'bg-slate-900/20 border-slate-800'
            )}
        >
            {isPopular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-indigo-500 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wide">
                    Most Popular
                </div>
            )}

            <div className="mb-4">
                <h3 className="text-lg font-bold text-slate-100">{plan.label}</h3>
                <div className="flex items-baseline gap-1 mt-2">
                    <span className="text-3xl font-bold text-white">{plan.price}</span>
                    <span className="text-sm text-slate-400">{plan.period}</span>
                </div>
                <p className="text-xs text-slate-400 mt-2 h-10">{plan.description}</p>
            </div>

            <ul className="space-y-3 mb-8 flex-grow">
                {plan.features.map((feat, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm text-slate-300">
                        <Check className={cn("w-4 h-4 mt-0.5", isPopular ? 'text-indigo-400' : 'text-emerald-500')} />
                        <span>{feat}</span>
                    </li>
                ))}
            </ul>

            <button
                onClick={() => !isCurrent && onUpgrade(plan.id)}
                disabled={isCurrent}
                className={cn(
                    "w-full py-3 rounded-xl font-medium transition-all text-sm",
                    isCurrent
                        ? 'bg-slate-700/50 text-slate-400 cursor-default'
                        : isPopular
                            ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/25'
                            : 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700'
                )}
            >
                {isCurrent ? 'Current Plan' : plan.cta}
            </button>
        </motion.div>
    );
}

'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, MoreVertical, Shield, CreditCard, Zap, ShieldCheck } from 'lucide-react';
import { GlassCard } from '../GlassCard';

interface UserData {
    user_id: string;
    tier: string;
    status: string;
    payment_method: string;
    updated_at: string;
    user_usage_quotas: { token_usage_current: number; token_usage_limit: number } | null;
}

interface UserManagerTableProps {
    users: UserData[];
    onUpdateTier?: null; // Deprecated
}

// Helper to update tier
const updateTier = async (userId: string, newTier: string) => {
    const res = await fetch('/api/billing/admin/tier', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, tier: newTier })
    });
    if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to update tier');
    }
};

export function UserManagerTable({ users }: UserManagerTableProps) {
    const [search, setSearch] = useState('');
    const [updating, setUpdating] = useState<string | null>(null);

    const filteredUsers = users.filter(u =>
        u.user_id.toLowerCase().includes(search.toLowerCase())
    );

    const getTierColor = (tier: string) => {
        switch (tier) {
            case 'enterprise': return 'text-amber-400 bg-amber-400/10 border-amber-400/20';
            case 'pro': return 'text-indigo-400 bg-indigo-400/10 border-indigo-400/20';
            default: return 'text-slate-400 bg-slate-400/10 border-slate-400/20';
        }
    };

    return (
        <GlassCard className="overflow-hidden">
            {/* Header */}
            <div className="p-6 border-b border-slate-800/50 flex flex-col md:flex-row justify-between items-center gap-4">
                <h3 className="text-lg font-semibold text-white">User Subscriptions</h3>
                <div className="relative w-full md:w-72">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                        type="text"
                        placeholder="Search User ID..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full bg-slate-900/50 border border-slate-800 rounded-lg pl-10 pr-4 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                    />
                </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-900/30 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                            <th className="px-6 py-4">User ID</th>
                            <th className="px-6 py-4">Tier</th>
                            <th className="px-6 py-4">Payment</th>
                            <th className="px-6 py-4">Usage</th>
                            <th className="px-6 py-4">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/50">
                        <AnimatePresence>
                            {filteredUsers.map((user) => (
                                <motion.tr
                                    key={user.user_id}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="group hover:bg-slate-800/20 transition-colors"
                                >
                                    <td className="px-6 py-4">
                                        <code className="text-xs text-indigo-300 bg-indigo-500/5 px-2 py-1 rounded">
                                            {user.user_id}
                                        </code>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase border ${getTierColor(user.tier)}`}>
                                            {user.tier}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2 text-xs text-slate-400">
                                            {user.payment_method === 'staking' ? (
                                                <Zap className="w-3 h-3 text-amber-400" />
                                            ) : (
                                                <CreditCard className="w-3 h-3 text-indigo-400" />
                                            )}
                                            {user.payment_method}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="w-24">
                                            <div className="flex justify-between text-[10px] text-slate-500 mb-1">
                                                <span>{(user.user_usage_quotas?.token_usage_current || 0).toLocaleString()}</span>
                                                <span>/</span>
                                                <span>{user.user_usage_quotas?.token_usage_limit === 999999999 ? '∞' : (user.user_usage_quotas?.token_usage_limit || 0).toLocaleString()}</span>
                                            </div>
                                            <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-indigo-500"
                                                    style={{
                                                        width: `${Math.min(100, ((user.user_usage_quotas?.token_usage_current || 0) / (user.user_usage_quotas?.token_usage_limit || 1)) * 100)}%`
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex gap-2">
                                            {['free', 'pro', 'enterprise'].filter(t => t !== user.tier).map(tier => (
                                                <button
                                                    key={tier}
                                                    disabled={updating === user.user_id}
                                                    onClick={async () => {
                                                        setUpdating(user.user_id);
                                                        try {
                                                            await updateTier(user.user_id, tier);
                                                            // Optimistic update or reload?
                                                            // For now, just reload to reflect changes
                                                            window.location.reload();
                                                        } catch (e) {
                                                            alert('Failed to update tier');
                                                            console.error(e);
                                                        } finally {
                                                            setUpdating(null);
                                                        }
                                                    }}
                                                    className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all text-[10px] uppercase font-bold disabled:opacity-50"
                                                >
                                                    {tier}
                                                </button>
                                            ))}
                                        </div>
                                    </td>
                                </motion.tr>
                            ))}
                        </AnimatePresence>
                    </tbody>
                </table>
            </div>
        </GlassCard>
    );
}

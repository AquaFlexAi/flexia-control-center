'use client';

import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { useWallet } from '@/hooks/useWallet';

// Atomic Components
import { BillingStats } from '@/components/billing/BillingStats';
import { PlansSection } from '@/components/billing/PlansSection';
import { StakingDashboard } from '@/components/billing/StakingDashboard';
import { StakingForm } from '@/components/billing/StakingForm';
import { SubscriptionData } from '@/components/billing/constants';

// --- Main Page Component ---

export default function BillingPage() {
    const { connect } = useWallet();
    const [loading, setLoading] = useState(true);
    const [sub, setSub] = useState<SubscriptionData | null>(null);
    const [activeTab, setActiveTab] = useState<'overview' | 'staking'>('overview');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const res = await fetch('/api/billing/status');
            if (res.ok) {
                const data = await res.json();
                setSub(data);
            } else {
                console.error('Failed to fetch billing status:', res.statusText);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleUpgrade = async (tier: string) => {
        try {
            const res = await fetch('/api/billing/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tier }),
            });
            const { url } = await res.json();
            if (url) window.location.href = url;
        } catch (err) {
            alert('Failed to start checkout');
        }
    };

    if (loading) return (
        <div className="flex h-screen items-center justify-center bg-[#0B0E14]">
            <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
        </div>
    );

    return (
        <div className="min-h-screen bg-[#0B0E14] text-slate-200 font-sans selection:bg-indigo-500/30">
            {/* Header */}
            <header className="border-b border-slate-800/50 bg-[#0B0E14]/80 backdrop-blur-md sticky top-0 z-10 px-8 py-4">
                <div className="max-w-7xl mx-auto flex justify-between items-center">
                    <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
                        Billing & Staking
                    </h1>
                    <div className="flex gap-2">
                        {['overview', 'staking'].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab as any)}
                                className={`px-4 py-2 text-sm font-medium rounded-lg transition-all
                                    ${activeTab === tab
                                        ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-500/20'
                                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'}`}
                            >
                                {tab.charAt(0).toUpperCase() + tab.slice(1)}
                            </button>
                        ))}
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-8 py-12">
                <AnimatePresence mode="wait">
                    {activeTab === 'overview' ? (
                        <motion.div
                            key="overview"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            className="space-y-12"
                        >
                            <BillingStats
                                sub={sub}
                                onViewStaking={() => setActiveTab('staking')}
                            />

                            <PlansSection
                                currentTier={sub?.tier || 'free'}
                                onUpgrade={handleUpgrade}
                            />
                        </motion.div>
                    ) : (
                        <motion.div
                            key="staking"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="grid grid-cols-1 lg:grid-cols-3 gap-8"
                        >
                            {/* Left Column: Dashboard */}
                            <StakingDashboard sub={sub} />

                            {/* Right Column: Stake Form */}
                            <div>
                                <StakingForm onStakeComplete={loadData} />
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>
        </div>
    );
}

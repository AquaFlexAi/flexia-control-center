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
import { GlobalKpiBar } from '@/components/billing/admin/GlobalKpiBar';
import { UserManagerTable } from '@/components/billing/admin/UserManagerTable';

// --- Main Page Component ---

export default function BillingPage() {
    const { connect } = useWallet();
    const [loading, setLoading] = useState(true);
    const [sub, setSub] = useState<SubscriptionData | null>(null);
    const [activeTab, setActiveTab] = useState<'overview' | 'staking' | 'management'>('overview');
    const [isAuthorized, setIsAuthorized] = useState(false);
    const [adminStats, setAdminStats] = useState(null);
    const [adminUsers, setAdminUsers] = useState([]);

    useEffect(() => {
        loadData();
        checkPermissions();
    }, []);

    useEffect(() => {
        if (activeTab === 'management' && isAuthorized) {
            loadAdminData();
        }
    }, [activeTab, isAuthorized]);

    const checkPermissions = async () => {
        try {
            const res = await fetch('/api/billing/admin/stats');
            if (res.ok) setIsAuthorized(true);
        } catch (e) {
            setIsAuthorized(false);
        }
    };

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

    const loadAdminData = async () => {
        try {
            const [statsRes, usersRes] = await Promise.all([
                fetch('/api/billing/admin/stats'),
                fetch('/api/billing/admin/users')
            ]);

            if (statsRes.ok) setAdminStats(await statsRes.json());
            if (usersRes.ok) setAdminUsers(await usersRes.json());
        } catch (e) {
            console.error('Failed to load admin data:', e);
        }
    };

    const handleUpdateTier = async (userId: string, tier: string) => {
        try {
            const res = await fetch('/api/billing/admin/users', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, tier }),
            });
            if (res.ok) {
                loadAdminData();
            }
        } catch (e) {
            alert('Failed to update user tier');
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

    const tabs = ['overview', 'staking'];
    if (isAuthorized) tabs.push('management');

    return (
        <div className="text-slate-200 selection:bg-indigo-500/30">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">
                        Billing & Staking
                    </h1>
                    <p className="text-slate-500 mt-1 text-sm">
                        Manage your subscription, credits, and crypto staking positions.
                    </p>
                </div>

                <div className="flex bg-slate-900/50 p-1 rounded-xl border border-slate-800/50 backdrop-blur-sm self-start md:self-center">
                    {tabs.map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab as any)}
                            className={`px-5 py-2 text-xs font-bold rounded-lg transition-all uppercase tracking-wider
                                ${activeTab === tab
                                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                                    : 'text-slate-500 hover:text-slate-300'}`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>
            </div>

            <AnimatePresence mode="wait">
                    {activeTab === 'overview' && (
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
                    )}

                    {activeTab === 'staking' && (
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

                    {activeTab === 'management' && isAuthorized && (
                        <motion.div
                            key="management"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="space-y-12"
                        >
                            <GlobalKpiBar stats={adminStats} />

                            <UserManagerTable
                                users={adminUsers}
                                onUpdateTier={handleUpdateTier}
                            />
                        </motion.div>
                    )}
                </AnimatePresence>
        </div>
    );
}

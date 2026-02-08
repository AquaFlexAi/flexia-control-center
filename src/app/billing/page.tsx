import React, { useEffect, useState } from "react";
import {
    CreditCard,
    Zap,
    History,
    ArrowUpRight,
    Download,
    Check,
    BadgePercent,
    TrendingUp,
    Wallet,
    Loader2
} from "lucide-react";

export default function BillingPage() {
    const [billingData, setBillingData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchBilling() {
            try {
                const resp = await fetch('/api/billing');
                if (resp.ok) {
                    const data = await resp.json();
                    setBillingData(data);
                }
            } catch (err) {
                console.error("Failed to fetch billing data", err);
            } finally {
                setLoading(false);
            }
        }
        fetchBilling();
    }, []);

    if (loading) {
        return (
            <div className="h-[60vh] flex items-center justify-center">
                <Loader2 className="w-10 h-10 text-purple-500 animate-spin" />
            </div>
        );
    }

    const { credits, transactions } = billingData || { credits: { balance: 0, tier: 'starter' }, transactions: [] };

    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
            <div>
                <h1 className="text-3xl font-bold text-white mb-2">Billing & Credits</h1>
                <p className="text-muted-foreground">Manage your subscription, credits, and view transaction history.</p>
            </div>

            {/* Credit Balance Card */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 glass-card accent-gradient text-white !border-none flex flex-col justify-between min-h-[240px] relative overflow-hidden group">
                    <div className="absolute top-[-20%] right-[-10%] w-64 h-64 bg-white/10 rounded-full blur-3xl group-hover:bg-white/20 transition-all duration-700" />
                    <div className="relative z-10">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-sm font-medium opacity-80 uppercase tracking-widest mb-1">Available Credits</p>
                                <h2 className="text-5xl font-extrabold tracking-tighter italic">{credits.balance.toLocaleString()} <span className="text-xl font-normal not-italic opacity-60 ml-1">FLX</span></h2>
                            </div>
                            <Wallet className="w-10 h-10 opacity-40" />
                        </div>
                        <p className="mt-6 text-sm opacity-90 max-w-sm">
                            Your credits are shared across all FlexIA services. Estimated to last {Math.floor(credits.balance / 1000)} days based on your current usage.
                        </p>
                    </div>
                    <div className="relative z-10 flex gap-4 mt-8">
                        <button className="bg-white text-purple-600 px-6 py-3 rounded-xl font-bold text-sm shadow-xl hover:bg-opacity-90 transition-all">
                            Top Up Credits
                        </button>
                        <button className="bg-white/20 backdrop-blur-md text-white px-6 py-3 rounded-xl font-bold text-sm border border-white/20 hover:bg-white/30 transition-all">
                            View Usage Report
                        </button>
                    </div>
                </div>

                <div className="glass-card flex flex-col justify-between">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="font-bold text-white flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-emerald-400" /> Daily Spend
                        </h3>
                        <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">Last 7 Days</span>
                    </div>
                    <div className="flex-1 flex items-end gap-2 px-2 h-32">
                        {[40, 70, 45, 90, 65, 80, 55].map((h, i) => (
                            <div key={i} className="flex-1 bg-white/5 rounded-t-lg group relative overflow-hidden">
                                <div
                                    className="absolute bottom-0 left-0 right-0 accent-gradient transition-all duration-700 group-hover:opacity-80"
                                    style={{ height: `${h}%` }}
                                />
                            </div>
                        ))}
                    </div>
                    <div className="mt-6 pt-6 border-t border-white/5 flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">Status: <span className="text-white font-bold uppercase tracking-widest text-[10px]">{credits.tier}</span></span>
                        <span className="text-emerald-400 font-bold flex items-center gap-1">
                            <BadgePercent className="w-4 h-4" /> -12% avg
                        </span>
                    </div>
                </div>
            </div>

            {/* Subscription Plans */}
            <div className="space-y-6">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <Zap className="w-5 h-5 text-yellow-400" /> Subscription Plan
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[
                        { name: "Starter", price: "$0", id: "starter", features: ["1 Agent", "Basic Router", "Community Support"] },
                        { name: "Professional", price: "$49", id: "professional", features: ["10 Agents", "Advanced Router", "Priority Logic", "Slack Support"] },
                        { name: "Enterprise", price: "Custom", id: "enterprise", features: ["Unlimited Agents", "Custom LLM Hosting", "Dedicated Manager", "99.99% SLA"] },
                    ].map((plan, i) => (
                        <div key={i} className={cn(
                            "glass-card border-2 flex flex-col gap-6 relative overflow-hidden transition-all duration-500",
                            credits.tier === plan.id ? "border-purple-500/50 shadow-purple-500/10 shadow-2xl scale-[1.02]" : "border-white/5 hover:border-white/10"
                        )}>
                            {credits.tier === plan.id && (
                                <div className="absolute top-0 right-0 bg-purple-500 text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl uppercase tracking-widest">
                                    Current Plan
                                </div>
                            )}
                            <div>
                                <h3 className="text-lg font-bold text-white">{plan.name}</h3>
                                <div className="mt-2 flex items-baseline gap-1">
                                    <span className="text-3xl font-black text-white">{plan.price}</span>
                                    <span className="text-sm text-muted-foreground">/month</span>
                                </div>
                            </div>
                            <ul className="space-y-4 flex-1">
                                {plan.features.map((f, j) => (
                                    <li key={j} className="flex items-center gap-3 text-sm text-muted-foreground">
                                        <div className="w-5 h-5 rounded-full bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
                                            <Check className="w-3 h-3 text-purple-400" />
                                        </div>
                                        {f}
                                    </li>
                                ))}
                            </ul>
                            <button className={cn(
                                "w-full py-3 rounded-xl font-bold text-sm transition-all duration-300",
                                credits.tier === plan.id
                                    ? "bg-white/10 text-white cursor-default"
                                    : "glass hover:bg-white/10 text-white"
                            )}>
                                {credits.tier === plan.id ? "Installed" : "Upgrade Plan"}
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            {/* Transaction History */}
            <div className="space-y-6">
                <div className="flex justify-between items-center border-b border-white/5 pb-4">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <History className="w-5 h-5 text-blue-400" /> Recent Transactions
                    </h2>
                    <button className="text-xs font-bold text-purple-400 flex items-center gap-1 hover:text-purple-300 transition-colors">
                        View All <ArrowUpRight className="w-3 h-3" />
                    </button>
                </div>
                <div className="glass-card !p-0 overflow-hidden">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-white/5 border-b border-white/5 text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">
                                <th className="px-6 py-4">Transaction ID</th>
                                <th className="px-6 py-4">Date</th>
                                <th className="px-6 py-4">Description</th>
                                <th className="px-6 py-4">Amount</th>
                                <th className="px-6 py-4 text-right">Invoice</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {transactions.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground text-sm font-medium">No recent transactions.</td>
                                </tr>
                            ) : transactions.map((txn: any, i: number) => (
                                <tr key={i} className="hover:bg-white/5 transition-colors group">
                                    <td className="px-6 py-4 font-mono text-[10px] text-muted-foreground group-hover:text-white transition-colors uppercase">{txn.id.slice(0, 8)}</td>
                                    <td className="px-6 py-4 text-sm text-muted-foreground">{new Date(txn.created_at).toLocaleDateString()}</td>
                                    <td className="px-6 py-4 text-sm font-medium text-white">{txn.description}</td>
                                    <td className={cn("px-6 py-4 text-sm font-bold", txn.type === 'topup' ? "text-emerald-400" : "text-white")}>
                                        {txn.type === 'topup' ? '+' : '-'}${Math.abs(txn.amount).toFixed(2)}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button className="p-2 glass rounded-lg hover:bg-white/10 transition-all text-purple-400">
                                            <Download className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

// Minimal Helper for layout
function cn(...inputs: any[]) {
    return inputs.filter(Boolean).join(" ");
}

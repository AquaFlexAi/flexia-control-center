"use client";

import React from "react";
import Link from "next/link";
import {
    CheckCircle2,
    Circle,
    Construction,
    ArrowRight,
    LayoutTemplate,
    Globe,
    ShieldCheck,
    Cpu,
    BookOpen
} from "lucide-react";
import { cn } from "@/lib/utils";

interface PhaseCardProps {
    phase: number;
    title: string;
    progress: number; // 0-100
    status: 'completed' | 'in-progress' | 'planned';
    details: string;
}

function PhaseCard({ phase, title, progress, status, details }: PhaseCardProps) {
    const statusColor =
        status === 'completed' ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' :
            status === 'in-progress' ? 'text-amber-400 bg-amber-500/10 border-amber-500/20' :
                'text-muted-foreground bg-white/5 border-white/5';

    return (
        <div className={cn("p-4 rounded-xl border relative overflow-hidden group hover:border-white/10 transition-all", statusColor)}>
            <div className="flex justify-between items-start mb-2">
                <span className="text-xs font-bold tracking-widest uppercase opacity-70">Phase {phase}</span>
                {status === 'completed' && <CheckCircle2 className="w-4 h-4" />}
                {status === 'in-progress' && <Construction className="w-4 h-4 animate-pulse" />}
                {status === 'planned' && <Circle className="w-4 h-4" />}
            </div>

            <h3 className="font-bold text-white mb-1">{title}</h3>
            <p className="text-xs opacity-70 mb-4 h-8">{details}</p>

            <div className="w-full bg-black/20 h-1.5 rounded-full overflow-hidden">
                <div
                    className={cn("h-full transition-all duration-1000",
                        status === 'completed' ? 'bg-emerald-500' :
                            status === 'in-progress' ? 'bg-amber-500' : 'bg-white/10'
                    )}
                    style={{ width: `${progress}%` }}
                />
            </div>
        </div>
    );
}

export function ProgressDashboard() {
    const phases: PhaseCardProps[] = [
        { phase: 1, title: "Identity & Governance", progress: 100, status: 'completed', details: "On-chain registry, Ed25519 keys, staking logic." },
        { phase: 2, title: "P2P Transport", progress: 100, status: 'completed', details: "Libp2p stack, Noise encryption, Yamux multiplexing." },
        { phase: 3, title: "Traffic Routing", progress: 100, status: 'completed', details: "SOCKS5 entry, exit node logic, tunneling protocol." },
        { phase: 4, title: "Settlement Layer", progress: 100, status: 'completed', details: "Micropayment vouchers, on-chain rewards, redemption." },
        { phase: 5, title: "Reputation System", progress: 100, status: 'completed', details: "Autonomous auditing, slashing, fraud detection." },
        { phase: 6, title: "Sovereign Multidimensional Chain", progress: 60, status: 'in-progress', details: "Hyper-Hub prototype, AI-Dimension token (FLA)." },
        { phase: 7, title: "Authority & Scaling", progress: 30, status: 'in-progress', details: "Voucher signing authority, mobile-native nodes." },
        { phase: 8, title: "SDK Standardization", progress: 100, status: 'completed', details: "Unified @flexia/sdk for blockchain and p2p logic." },
    ];

    const pillars = [
        {
            icon: LayoutTemplate,
            title: "Control Plane",
            desc: "Centralized SaaS management for orchestration, billing, and UX.",
            link: "/docs/core/architecture"
        },
        {
            icon: Globe,
            title: "Sovereign Network",
            desc: "Decentralized P2P mesh for privacy-preserving AI compute.",
            link: "/docs/network"
        },
        {
            icon: Cpu,
            title: "Blockchain Consensus",
            desc: "Trustless layer for identity, payments, and reputation.",
            link: "/docs/network/multidimensional-chain"
        }
    ];

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Hero Section */}
            <div className="relative p-8 rounded-2xl glass-card border border-purple-500/20 bg-gradient-to-br from-purple-900/20 to-black overflow-hidden">
                <div className="absolute top-0 right-0 p-12 bg-purple-500/10 blur-[100px] rounded-full" />

                <h1 className="text-3xl font-extrabold text-white mb-2 flex items-center gap-3">
                    <BookOpen className="w-8 h-8 text-purple-400" />
                    FlexIA Knowledge Base
                </h1>
                <p className="text-lg text-muted-foreground max-w-2xl mb-6">
                    The central nervous system for the FlexIA Control Plane. access architectural blueprints,
                    implementation plans, and real-time network progress.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {pillars.map((p, i) => (
                        <Link
                            key={i}
                            href={p.link}
                            className="text-left p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-purple-500/30 transition-all group block"
                        >
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 rounded-lg bg-black/40 text-purple-400 group-hover:text-white transition-colors">
                                    <p.icon className="w-5 h-5" />
                                </div>
                                <span className="font-bold text-white group-hover:translate-x-1 transition-transform">{p.title}</span>
                            </div>
                            <p className="text-xs text-muted-foreground">{p.desc}</p>
                        </Link>
                    ))}
                </div>
            </div>

            {/* Progress Grid */}
            <div>
                <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <Construction className="w-5 h-5 text-amber-500" />
                    Implementation Roadmap
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {phases.map((p) => (
                        <PhaseCard key={p.phase} {...p} />
                    ))}
                </div>
            </div>
        </div>
    );
}

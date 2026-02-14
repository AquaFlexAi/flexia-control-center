"use client";

import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Gavel, CheckCircle2, XCircle, Clock, Loader2, ArrowRight } from 'lucide-react';

interface Proposal {
    id: number;
    target: string;
    description: string;
    forVotes: string;
    againstVotes: string;
    startTime: number;
    endTime: number;
    executed: boolean;
    canceled: boolean;
    state: number;
}

export function CouncilDashboard() {
    const [proposals, setProposals] = useState<Proposal[]>([]);
    const [loading, setLoading] = useState(true);
    const [votingId, setVotingId] = useState<number | null>(null);

    async function fetchProposals() {
        setLoading(true);
        try {
            const res = await fetch('/api/sovereign/proposals');
            const data = await res.json();
            setProposals(data.proposals || []);
        } catch (err) {
            console.error("Failed to fetch proposals", err);
        } finally {
            setLoading(false);
        }
    }

    async function handleVote(proposalId: number, support: boolean) {
        setVotingId(proposalId);
        try {
            const res = await fetch('/api/sovereign/proposals/vote', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ proposalId, support })
            });
            if (res.ok) {
                await fetchProposals();
                alert("Vote cast successfully!");
            } else {
                const err = await res.json();
                alert(`Vote failed: ${err.error}`);
            }
        } catch (err: any) {
            alert(`Error: ${err.message}`);
        } finally {
            setVotingId(null);
        }
    }

    useEffect(() => {
        fetchProposals();
    }, []);

    const getStatusLabel = (state: number) => {
        const states = [
            { label: 'Pending', color: 'bg-yellow-500/10 text-yellow-500' },
            { label: 'Active', color: 'bg-green-500/10 text-green-500' },
            { label: 'Canceled', color: 'bg-gray-500/10 text-gray-500' },
            { label: 'Defeated', color: 'bg-red-500/10 text-red-500' },
            { label: 'Succeeded', color: 'bg-blue-500/10 text-blue-500' },
            { label: 'Queued', color: 'bg-purple-500/10 text-purple-500' },
            { label: 'Expired', color: 'bg-gray-500/10 text-gray-500' },
            { label: 'Executed', color: 'bg-teal-500/10 text-teal-500' }
        ];
        return states[state] || { label: 'Unknown', color: 'bg-gray-500/10 text-gray-500' };
    };

    if (loading && proposals.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
                <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
                <p className="text-muted-foreground">Fetching Council Proposals...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <Gavel className="w-6 h-6 text-purple-400" /> Active Governance
                </h2>
                <Button variant="outline" size="sm" onClick={fetchProposals} disabled={loading}>
                    <Clock className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} /> Sync Chain
                </Button>
            </div>

            {proposals.length === 0 ? (
                <Card className="bg-white/5 border-white/5">
                    <CardContent className="py-12 text-center">
                        <p className="text-muted-foreground">No active proposals found in the Sovereign Council.</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid grid-cols-1 gap-4">
                    {proposals.map((prop) => (
                        <Card key={prop.id} className="bg-white/5 border-white/5 overflow-hidden hover:bg-white/[0.07] transition-all">
                            <CardContent className="p-0">
                                <div className="p-6 flex flex-col md:flex-row gap-6">
                                    <div className="flex-1 space-y-3">
                                        <div className="flex items-center gap-3">
                                            <span className="text-xs font-mono text-white/40">#{prop.id}</span>
                                            <Badge className={getStatusLabel(prop.state).color + " border-none"}>
                                                {getStatusLabel(prop.state).label}
                                            </Badge>
                                        </div>
                                        <h3 className="text-lg font-semibold text-white">{prop.description}</h3>
                                        <p className="text-sm text-muted-foreground font-mono truncate">Target: {prop.target}</p>

                                        <div className="flex items-center gap-6 mt-4">
                                            <div className="space-y-1">
                                                <p className="text-[10px] uppercase tracking-wider text-white/40">For</p>
                                                <p className="text-sm font-bold text-green-400">{prop.forVotes} FLX</p>
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-[10px] uppercase tracking-wider text-white/40">Against</p>
                                                <p className="text-sm font-bold text-red-400">{prop.againstVotes} FLX</p>
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-[10px] uppercase tracking-wider text-white/40">Ends In</p>
                                                <p className="text-sm font-bold text-white">
                                                    {prop.endTime > Date.now() / 1000
                                                        ? Math.ceil((prop.endTime - Date.now() / 1000) / 3600) + "h"
                                                        : "Ended"}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex flex-row md:flex-col justify-center gap-2">
                                        {prop.state === 1 && (
                                            <>
                                                <Button
                                                    size="sm"
                                                    className="bg-green-500/20 hover:bg-green-500/30 text-green-400 border border-green-500/30"
                                                    onClick={() => handleVote(prop.id, true)}
                                                    disabled={votingId !== null}
                                                >
                                                    {votingId === prop.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-2" />} Vote For
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    className="bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30"
                                                    onClick={() => handleVote(prop.id, false)}
                                                    disabled={votingId !== null}
                                                >
                                                    {votingId === prop.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4 mr-2" />} Vote Against
                                                </Button>
                                            </>
                                        )}
                                        {prop.state === 4 && (
                                            <Button size="sm" className="bg-blue-500 hover:bg-blue-600 text-white">
                                                Execute Proposal <ArrowRight className="w-4 h-4 ml-2" />
                                            </Button>
                                        )}
                                    </div>
                                </div>
                                <div className="h-1 bg-white/5 relative">
                                    <div
                                        className="h-full bg-green-500 absolute left-0 top-0 transition-all duration-1000"
                                        style={{ width: `${(Number(prop.forVotes) / (Number(prop.forVotes) + Number(prop.againstVotes) || 1)) * 100}%` }}
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}

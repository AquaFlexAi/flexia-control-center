"use client";

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Gavel, CheckCircle2, XCircle, Clock, Loader2, ArrowRight } from 'lucide-react';
import { useCouncil } from '@/hooks/useCouncil';
import { CreateProposalModal } from './CreateProposalModal';

export function CouncilDashboard() {
    const { proposals, loading, refresh, castVote, execute } = useCouncil();
    const [votingId, setVotingId] = React.useState<number | null>(null);

    async function handleVote(proposalId: number, support: boolean) {
        setVotingId(proposalId);
        try {
            await castVote(proposalId, support);
        } catch (err: any) {
            alert(`Vote failed: ${err.message}`);
        } finally {
            setVotingId(null);
        }
    }

    async function handleExecute(proposalId: number) {
        setVotingId(proposalId);
        try {
            await execute(proposalId);
        } catch (err: any) {
            alert(`Execution failed: ${err.message}`);
        } finally {
            setVotingId(null);
        }
    }

    const getStatusLabel = (status: number) => {
        const states = [
            { label: 'Pending', color: 'bg-yellow-500/10 text-yellow-500' },
            { label: 'Active', color: 'bg-green-500/10 text-green-500' },
            { label: 'Defeated', color: 'bg-red-500/10 text-red-500' },
            { label: 'Succeeded', color: 'bg-blue-500/10 text-blue-500' },
            { label: 'Executed', color: 'bg-teal-500/10 text-teal-500' }
        ];
        // Ensure index boundary
        return states[status] || { label: 'Unknown', color: 'bg-gray-500/10 text-gray-500' };
    };

    if (loading && proposals.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
                <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
                <p className="text-white/40 font-mono text-sm">Syncing Governance Chain...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <Gavel className="w-6 h-6 text-amber-500" /> Active Governance
                </h2>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={refresh} disabled={loading} className="border-slate-800 bg-slate-900/50 hover:bg-slate-800 text-slate-400">
                        <Clock className={`w-3.5 h-3.5 mr-2 ${loading ? 'animate-spin' : ''}`} /> Sync
                    </Button>
                    <CreateProposalModal onProposalCreated={refresh} />
                </div>
            </div>

            {proposals.length === 0 ? (
                <Card className="bg-slate-950/30 border-slate-800/60 backdrop-blur-sm">
                    <CardContent className="py-12 text-center">
                        <p className="text-slate-500">No active proposals found in the Sovereign Council.</p>
                        <p className="text-xs text-slate-600 mt-2">Create a proposal to start governance.</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid grid-cols-1 gap-4">
                    {proposals.map((prop) => (
                        <Card key={prop.id} className="bg-slate-950/40 border-slate-800/60 hover:bg-slate-900/40 transition-all overflow-hidden relative group">
                            {/* Glow Effect */}
                            <div className="absolute inset-0 bg-gradient-to-r from-amber-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

                            <CardContent className="p-0">
                                <div className="p-6 flex flex-col md:flex-row gap-6 relative z-10">
                                    <div className="flex-1 space-y-3">
                                        <div className="flex items-center gap-3">
                                            <span className="text-xs font-mono text-slate-500">#{prop.id}</span>
                                            <Badge className={getStatusLabel(prop.status).color + " border-none"}>
                                                {getStatusLabel(prop.status).label}
                                            </Badge>
                                            {prop.hasVoted && (
                                                <Badge variant="outline" className="text-[10px] border-slate-700 text-slate-400">
                                                    Voted
                                                </Badge>
                                            )}
                                        </div>
                                        <h3 className="text-lg font-semibold text-slate-200">{prop.description}</h3>
                                        <p className="text-xs text-slate-500 font-mono truncate max-w-md bg-slate-950/50 p-1.5 rounded border border-slate-800/50">
                                            Target: {prop.target}
                                        </p>

                                        <div className="flex items-center gap-8 mt-4">
                                            <div className="space-y-1">
                                                <p className="text-[10px] uppercase tracking-wider text-slate-500">For</p>
                                                <p className="text-sm font-bold text-emerald-400 font-mono">{Number(prop.forVotes).toLocaleString()} FLX</p>
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-[10px] uppercase tracking-wider text-slate-500">Against</p>
                                                <p className="text-sm font-bold text-red-400 font-mono">{Number(prop.againstVotes).toLocaleString()} FLX</p>
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-[10px] uppercase tracking-wider text-slate-500">Ends In</p>
                                                <p className="text-sm font-bold text-slate-300">
                                                    {prop.endTime > Date.now() / 1000
                                                        ? Math.ceil((prop.endTime - Date.now() / 1000) / 3600) + "h"
                                                        : "Ended"}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex flex-row md:flex-col justify-center gap-2">
                                        {prop.status === 1 && !prop.hasVoted && (
                                            <>
                                                <Button
                                                    size="sm"
                                                    className="bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 border border-emerald-500/20"
                                                    onClick={() => handleVote(prop.id, true)}
                                                    disabled={votingId !== null}
                                                >
                                                    {votingId === prop.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-2" />} Vote For
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    className="bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20"
                                                    onClick={() => handleVote(prop.id, false)}
                                                    disabled={votingId !== null}
                                                >
                                                    {votingId === prop.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4 mr-2" />} Vote Against
                                                </Button>
                                            </>
                                        )}
                                        {prop.status === 3 && (
                                            <Button
                                                size="sm"
                                                className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold"
                                                onClick={() => handleExecute(prop.id)}
                                                disabled={votingId !== null}
                                            >
                                                {votingId === prop.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4 mr-2" />} Execute
                                            </Button>
                                        )}
                                    </div>
                                </div>
                                <div className="h-1 bg-slate-800 relative">
                                    <div
                                        className="h-full bg-emerald-500 absolute left-0 top-0 transition-all duration-1000 shadow-[0_0_10px_rgba(16,185,129,0.5)]"
                                        style={{ width: `${(Number(prop.forVotes) / ((Number(prop.forVotes) + Number(prop.againstVotes)) || 1)) * 100}%` }}
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


import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2, Plus, AlertCircle, Gavel } from 'lucide-react';
import { useCouncil } from '@/hooks/useCouncil';
import deployments from '@/lib/blockchain/deployments.json';
import { cn } from '@/lib/utils'; // Assuming cn utility is available

const PROPOSAL_PRESETS = [
    { label: '📢 Community Signal', type: 'signal', target: '0x0000000000000000000000000000000000000000', description: 'Non-binding vote for community sentiment and signaling.' },
    { label: '💰 Revenue Hub Update', type: 'technical', target: deployments.revenueHub, description: 'Adjust protocol revenue distribution and splits.' },
    { label: '💎 Profit Pool Update', type: 'technical', target: deployments.profitPool, description: 'Modify staking multipliers or reward distribution logic.' },
    { label: '🛡️ Genesis Badge Update', type: 'technical', target: deployments.genesisBadge, description: 'Modify parameters for the Genesis Badge NFT collection.' },
    { label: '🛠️ Custom / Advanced', type: 'custom', target: '', description: 'Manually specify a target contract address.' }
];

export function CreateProposalModal({ onProposalCreated }: { onProposalCreated?: () => void }) {
    const [open, setOpen] = useState(false);
    const { propose, loading, error } = useCouncil();

    // Form State
    const [selectedType, setSelectedType] = useState(PROPOSAL_PRESETS[0]);
    const [target, setTarget] = useState(PROPOSAL_PRESETS[0].target);
    const [description, setDescription] = useState('');
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [showAdvanced, setShowAdvanced] = useState(false);

    const handleTypeChange = (preset: typeof PROPOSAL_PRESETS[0]) => {
        setSelectedType(preset);
        setTarget(preset.target);
        if (preset.type !== 'custom') {
            setShowAdvanced(false);
        } else {
            setShowAdvanced(true);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitError(null);

        if (!target || !description) {
            setSubmitError("Please fill in all fields.");
            return;
        }

        try {
            await propose(target, description);
            setOpen(false);
            setTarget(PROPOSAL_PRESETS[0].target);
            setDescription('');
            setSelectedType(PROPOSAL_PRESETS[0]);
            if (onProposalCreated) onProposalCreated();
        } catch (err: any) {
            const msg = err.reason || err.message || "Transaction failed";
            setSubmitError(msg);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-slate-950 font-bold border-0 shadow-lg shadow-amber-900/20">
                    <Plus className="w-4 h-4 mr-2" /> New Proposal
                </Button>
            </DialogTrigger>
            <DialogContent className="bg-slate-950 border-slate-800 text-slate-200 sm:max-w-[650px] md:max-w-3xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)]">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-amber-500/50 to-transparent" />

                <DialogHeader className="pt-6 px-4">
                    <DialogTitle className="text-2xl font-bold text-white flex items-center gap-3">
                        <div className="p-2 bg-amber-500/10 rounded-xl border border-amber-500/20">
                            <Gavel className="w-6 h-6 text-amber-500" />
                        </div>
                        Broadcast Governance Proposal
                    </DialogTitle>
                    <p className="text-slate-500 text-sm mt-1 ml-12">Submit a command to the Sovereign Council for network execution.</p>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-8 mt-6 px-4 pb-6">
                    <div className="space-y-6">
                        {/* Proposal Type Selection - Grid on Desktop */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <Label className="text-slate-400 text-[10px] uppercase tracking-[0.2em] font-black">Selection: Proposal Template</Label>
                                <span className="text-[10px] text-amber-500/60 font-mono">Step 1 of 2</span>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {PROPOSAL_PRESETS.map((p) => (
                                    <button
                                        key={p.label}
                                        type="button"
                                        onClick={() => handleTypeChange(p)}
                                        className={cn(
                                            "flex flex-col items-start p-4 rounded-2xl border text-left transition-all relative group",
                                            selectedType.label === p.label
                                                ? "bg-amber-500/5 border-amber-500/40 ring-1 ring-amber-500/20 shadow-[0_0_20px_rgba(245,158,11,0.05)]"
                                                : "bg-slate-900/40 border-slate-800/60 hover:border-slate-700 hover:bg-slate-900/60"
                                        )}
                                    >
                                        <div className="flex items-center justify-between w-full">
                                            <span className={cn(
                                                "font-bold text-sm",
                                                selectedType.label === p.label ? "text-amber-400" : "text-slate-300"
                                            )}>{p.label}</span>
                                            {selectedType.label === p.label && (
                                                <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse shadow-[0_0_8px_rgba(245,158,11,1)]" />
                                            )}
                                        </div>
                                        <span className="text-[10px] text-slate-500 mt-2 leading-relaxed opacity-80 group-hover:opacity-100 transition-opacity">{p.description}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="h-px bg-slate-800/50 w-full" />

                        {/* Description & Advanced Logic */}
                        <div className="space-y-5">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="description" className="text-slate-400 text-[10px] uppercase tracking-[0.2em] font-black">Configuration: Content</Label>
                                <span className="text-[10px] text-amber-500/60 font-mono">Step 2 of 2</span>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
                                <div className="space-y-2">
                                    <Textarea
                                        id="description"
                                        placeholder="What change are you proposing? Be specific..."
                                        value={description}
                                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDescription(e.target.value)}
                                        className="bg-slate-900/40 border-slate-800 min-h-[140px] focus:border-amber-500/40 transition-all text-slate-200 rounded-xl resize-none p-4"
                                    />
                                </div>

                                {/* Advanced Details (Conditional) */}
                                <div className="rounded-xl overflow-hidden border border-slate-800/40 bg-slate-900/20 transition-all">
                                    <button
                                        type="button"
                                        onClick={() => setShowAdvanced(!showAdvanced)}
                                        className="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-900/40 transition-colors"
                                    >
                                        <div className="flex items-center gap-2">
                                            <div className={cn("w-1.5 h-1.5 rounded-full", showAdvanced ? "bg-amber-500" : "bg-slate-700")} />
                                            <span className="text-[10px] text-slate-400 font-mono uppercase tracking-widest font-bold">Protocol Technical Specs</span>
                                        </div>
                                        <span className="text-[10px] text-slate-600 font-mono">{showAdvanced ? "[-]" : "[+]"}</span>
                                    </button>

                                    {showAdvanced && (
                                        <div className="px-4 pb-4 space-y-3 animate-in fade-in duration-300">
                                            <div className="space-y-1.5">
                                                <Label htmlFor="target" className="text-[9px] text-slate-500 font-mono uppercase">Call Target Address</Label>
                                                <Input
                                                    id="target"
                                                    value={target}
                                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTarget(e.target.value)}
                                                    className="bg-slate-950 border-slate-800 focus:border-amber-500/50 transition-colors font-mono text-xs h-9 text-slate-500"
                                                    disabled={selectedType.type !== 'custom'}
                                                />
                                            </div>
                                            <p className="text-[9px] text-slate-600 font-mono italic leading-relaxed">
                                                The Council will perform a low-level call to the target contract using the provided data-signature upon successful vote execution.
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Security Alert */}
                        <div className="bg-amber-950/20 p-4 rounded-2xl border border-amber-500/10 flex gap-4 items-center">
                            <div className="w-10 h-10 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
                                <AlertCircle className="w-5 h-5 text-amber-500" />
                            </div>
                            <div>
                                <h4 className="text-xs font-bold text-amber-500/80 uppercase tracking-tighter">Stake Requirement Detected</h4>
                                <p className="text-[10px] text-amber-200/40 leading-relaxed font-mono mt-0.5">
                                    A minimum balance of <strong className="text-amber-500/60">100,000 FLX</strong> is required to interact with the Governance Hub.
                                </p>
                            </div>
                        </div>
                    </div>

                    {submitError && (
                        <div className="bg-red-500/10 text-red-400 p-4 rounded-xl border border-red-500/20 text-xs flex items-center gap-3 animate-in shake-in duration-300">
                            <AlertCircle className="w-4 h-4 shrink-0" /> {submitError}
                        </div>
                    )}

                    <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t border-slate-800/50">
                        <Button type="button" variant="ghost" onClick={() => setOpen(false)} disabled={loading} className="text-slate-500 hover:text-slate-300 h-12 px-6 rounded-xl hover:bg-slate-900">
                            Discard Draft
                        </Button>
                        <Button
                            type="submit"
                            className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-slate-950 font-black px-10 h-12 rounded-xl shadow-xl shadow-amber-500/10 transition-all hover:scale-[1.02] active:scale-95 disabled:grayscale"
                            disabled={loading}
                        >
                            {loading ? (
                                <><Loader2 className="w-4 h-4 mr-3 animate-spin" /> PROVISIONING...</>
                            ) : (
                                "BROADCAST PROPOSAL"
                            )}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}

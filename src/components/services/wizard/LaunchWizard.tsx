import React, { useState } from 'react';
import { X, ChevronRight, ChevronLeft, Rocket, Server, Settings, Box } from 'lucide-react';
import { ServiceBasics } from './steps/ServiceBasics';
import { InfrastructureSelection } from './steps/InfrastructureSelection';
import { Configuration } from './steps/Configuration';
import { ReviewLaunch } from './steps/ReviewLaunch';

interface LaunchWizardProps {
    onClose: () => void;
    onSuccess: () => void;
}

export type WizardData = {
    name: string;
    type: string;
    service_kind?: string;
    slug?: string;
    image: string;
    run_mode: 'prod' | 'dev';
    instances: number;
    provider_id: string; // 'local' or UUID
    account_id?: string;
    region: string;
    instance_type?: string;
    ports: Record<string, string>;
    env_vars: Record<string, string>;
    volumes: string[];
    exposed_ip: string;
    walletAddress?: string;
    signature?: string;
    timestamp?: number;
    config?: any;
};

const INITIAL_DATA: WizardData = {
    name: '',
    type: 'api',
    image: '',
    run_mode: 'prod',
    instances: 1,
    provider_id: 'local',
    region: 'local',
    ports: {},
    env_vars: {},
    volumes: [],
    exposed_ip: '0.0.0.0',
    config: {}
};

export default function LaunchWizard({ onClose, onSuccess }: LaunchWizardProps) {
    const [step, setStep] = useState(1);
    const [data, setData] = useState<WizardData>(INITIAL_DATA);
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const updateData = (updates: Partial<WizardData>) => {
        setData(prev => ({ ...prev, ...updates }));
        if (error) setError(null); // Clear error on change
    };

    const handleNext = () => {
        if (step < 4) setStep(step + 1);
    };

    const handleBack = () => {
        if (step > 1) setStep(step - 1);
    };

    const handleSubmit = async () => {
        setIsSubmitting(true);
        setError(null);
        try {
            const res = await fetch('/api/services', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            const result = await res.json();

            if (!res.ok) {
                throw new Error(result.error || 'Failed to create service');
            }

            onSuccess();
            onClose();
        } catch (error: any) {
            console.error(error);
            setError(error.message || 'Failed to launch service');
        } finally {
            setIsSubmitting(false);
        }
    };

    const steps = [
        { id: 1, title: 'Service Basics', icon: Box },
        { id: 2, title: 'Infrastructure', icon: Server },
        { id: 3, title: 'Configuration', icon: Settings },
        { id: 4, title: 'Review & Launch', icon: Rocket }
    ];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
            <div className="w-full max-w-5xl bg-[#09090b] border border-white/10 rounded-2xl shadow-2xl flex flex-col h-[85vh] md:h-[800px] overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-8 py-6 border-b border-white/5 bg-gradient-to-r from-purple-500/5 to-transparent">
                    <div>
                        <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                            <div className="p-2 bg-purple-500/10 rounded-lg">
                                <Rocket className="w-6 h-6 text-purple-400" />
                            </div>
                            Launch New Service
                        </h2>
                        <p className="text-sm text-muted-foreground mt-1 ml-1">Deploy a new containerized service to your fleet</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-muted-foreground hover:text-white hover:bg-white/5 rounded-full transition-all"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Progress Steps */}
                <div className="px-8 mt-6">
                    <div className="flex items-center w-full">
                        {steps.map((s, i) => {
                            const isActive = step === s.id;
                            const isCompleted = step > s.id;

                            return (
                                <React.Fragment key={s.id}>
                                    <div className="flex flex-col gap-2 flex-1 relative">
                                        <div className={`
                                            flex items-center gap-3 px-4 py-3 rounded-lg border transition-all duration-300
                                            ${isActive
                                                ? 'bg-purple-500/10 border-purple-500/50 text-white shadow-[0_0_15px_-3px_rgba(168,85,247,0.2)]'
                                                : isCompleted
                                                    ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-400'
                                                    : 'bg-white/5 border-transparent text-muted-foreground opacity-50'
                                            }
                                        `}>
                                            <s.icon className={`w-5 h-5 ${isCompleted ? 'text-emerald-400' : isActive ? 'text-purple-400' : ''}`} />
                                            <span className="font-medium text-sm hidden md:inline">{s.title}</span>
                                        </div>

                                        {/* Progress Line */}
                                        {i < steps.length - 1 && (
                                            <div className="absolute top-1/2 -right-4 w-8 h-[2px] bg-white/5 -translate-y-1/2 hidden md:block" />
                                        )}
                                    </div>
                                    {i < steps.length - 1 && <div className="w-4 hidden md:block" />}
                                </React.Fragment>
                            )
                        })}
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto px-8 py-8 custom-scrollbar">
                    <div className="max-w-4xl mx-auto">
                        {step === 1 && <ServiceBasics data={data} updateData={updateData} />}
                        {step === 2 && <InfrastructureSelection data={data} updateData={updateData} />}
                        {step === 3 && <Configuration data={data} updateData={updateData} />}
                        {step === 4 && <ReviewLaunch data={data} />}
                    </div>
                </div>

                {/* Footer */}
                <div className="px-8 py-6 border-t border-white/5 bg-white/[0.02] mt-auto">
                    {error && (
                        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-3 text-sm text-red-200 animate-in fade-in slide-in-from-bottom-2">
                            <div className="p-1 bg-red-500/20 rounded-full">
                                <X className="w-3 h-3 text-red-400" />
                            </div>
                            {error}
                        </div>
                    )}

                    <div className="flex justify-between items-center">
                        <button
                            onClick={handleBack}
                            disabled={step === 1 || isSubmitting}
                            className={`
                                px-6 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center gap-2
                                ${step === 1
                                    ? 'text-muted-foreground/50 cursor-not-allowed'
                                    : 'text-muted-foreground hover:text-white hover:bg-white/5'
                                }
                            `}
                        >
                            <ChevronLeft className="w-4 h-4" /> Back
                        </button>

                        <div className="flex gap-3">
                            {step < 4 ? (
                                <button
                                    onClick={handleNext}
                                    disabled={!data.name || !data.image} // Basic validation
                                    className="group relative px-6 py-2.5 rounded-xl bg-white text-black font-semibold text-sm hover:bg-gray-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-shadow-sm flex items-center gap-2"
                                >
                                    Next Step
                                    <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                                </button>
                            ) : (
                                <button
                                    onClick={handleSubmit}
                                    disabled={isSubmitting}
                                    className="group relative px-8 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold text-sm hover:from-purple-500 hover:to-indigo-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_-5px_rgba(147,51,234,0.5)] flex items-center gap-2"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            Launching...
                                        </>
                                    ) : (
                                        <>
                                            Launch Service
                                            <Rocket className="w-4 h-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                                        </>
                                    )}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

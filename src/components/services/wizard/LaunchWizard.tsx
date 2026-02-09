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
    image: string;
    run_mode: 'prod' | 'dev';
    instances: number;
    provider_id: string; // 'local' or UUID
    region: string;
    ports: Record<string, string>;
    env_vars: Record<string, string>;
    volumes: string[];
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
    volumes: []
};

export default function LaunchWizard({ onClose, onSuccess }: LaunchWizardProps) {
    const [step, setStep] = useState(1);
    const [data, setData] = useState<WizardData>(INITIAL_DATA);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const updateData = (updates: Partial<WizardData>) => {
        setData(prev => ({ ...prev, ...updates }));
    };

    const handleNext = () => {
        if (step < 4) setStep(step + 1);
    };

    const handleBack = () => {
        if (step > 1) setStep(step - 1);
    };

    const handleSubmit = async () => {
        setIsSubmitting(true);
        try {
            const res = await fetch('/api/services', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            if (!res.ok) throw new Error('Failed to create service');
            
            onSuccess();
            onClose();
        } catch (error) {
            console.error(error);
            // Handle error (toast or alert)
            alert('Failed to launch service');
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="w-full max-w-4xl bg-[#0a0a0a] border border-white/10 rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-white/5 bg-white/5">
                    <div>
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            <Rocket className="w-5 h-5 text-purple-400" />
                            Launch New Service
                        </h2>
                        <p className="text-sm text-muted-foreground">Deploy a new containerized service to your fleet</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                        <X className="w-5 h-5 text-muted-foreground" />
                    </button>
                </div>

                {/* Progress Steps */}
                <div className="flex border-b border-white/5">
                    {steps.map((s, i) => (
                        <div 
                            key={s.id}
                            className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium border-b-2 transition-colors ${
                                step === s.id 
                                    ? 'border-purple-500 text-purple-400 bg-purple-500/5' 
                                    : step > s.id 
                                        ? 'border-emerald-500/50 text-emerald-400' 
                                        : 'border-transparent text-muted-foreground'
                            }`}
                        >
                            <s.icon className="w-4 h-4" />
                            <span className="hidden md:inline">{s.title}</span>
                        </div>
                    ))}
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                    {step === 1 && <ServiceBasics data={data} updateData={updateData} />}
                    {step === 2 && <InfrastructureSelection data={data} updateData={updateData} />}
                    {step === 3 && <Configuration data={data} updateData={updateData} />}
                    {step === 4 && <ReviewLaunch data={data} />}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-white/5 bg-white/5 flex justify-between items-center">
                    <button
                        onClick={handleBack}
                        disabled={step === 1 || isSubmitting}
                        className="px-4 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-white disabled:opacity-50 disabled:hover:text-muted-foreground transition-colors flex items-center gap-2"
                    >
                        <ChevronLeft className="w-4 h-4" /> Back
                    </button>

                    {step < 4 ? (
                        <button
                            onClick={handleNext}
                            disabled={!data.name || !data.image} // Basic validation
                            className="bg-white text-black px-6 py-2 rounded-lg text-sm font-bold hover:bg-white/90 transition-colors flex items-center gap-2 disabled:opacity-50"
                        >
                            Next Step <ChevronRight className="w-4 h-4" />
                        </button>
                    ) : (
                        <button
                            onClick={handleSubmit}
                            disabled={isSubmitting}
                            className="bg-purple-600 text-white px-8 py-2 rounded-lg text-sm font-bold hover:bg-purple-500 transition-colors flex items-center gap-2 shadow-lg shadow-purple-500/20 disabled:opacity-50"
                        >
                            {isSubmitting ? (
                                <>Launching...</>
                            ) : (
                                <>Launch Service <Rocket className="w-4 h-4" /></>
                            )}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

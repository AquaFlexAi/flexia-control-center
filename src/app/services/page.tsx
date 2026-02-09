"use client";

import React, { useState } from "react";
import { Loader2, Plus, LayoutGrid, Server } from "lucide-react";
import dynamic from 'next/dynamic';
import { usePermission } from "@/hooks/usePermission";
import { useServices } from "@/hooks/useServices";
import { Service } from "@/types/service";
import { ServiceCard } from "@/components/services/service-card";
import { DeploymentHistory } from "@/components/services/deployment-history";
import { EventStream } from "@/components/services/event-stream";
import { InfrastructureView } from "@/components/services/InfrastructureView";
import DeploymentModal from "@/components/services/deployment-modal";
import LaunchWizard from "@/components/services/wizard/LaunchWizard";

const TerminalConsole = dynamic(() => import('@/components/services/terminal-console'), { ssr: false });

export default function ServicesPage() {
    const { services, loading, actionInProgress, handleAction, setServices, refresh } = useServices();
    const [selectedTerminal, setSelectedTerminal] = useState<{ service: Service, instanceId?: string } | null>(null);
    const [selectedDeployService, setSelectedDeployService] = useState<Service | null>(null);
    const [showLaunchWizard, setShowLaunchWizard] = useState(false);
    const [viewMode, setViewMode] = useState<'services' | 'infrastructure'>('services');
    const { loading: roleLoading, can } = usePermission();

    if (loading || roleLoading) {
        return (
            <div className="h-[60vh] flex items-center justify-center">
                <Loader2 className="w-10 h-10 text-purple-500 animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2 underline underline-offset-8 decoration-purple-500/30">Service Fleet</h1>
                    <p className="text-muted-foreground">Manage and monitor deployment of your core FlexIA services.</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex bg-white/5 p-1 rounded-lg border border-white/10">
                        <button
                            onClick={() => setViewMode('services')}
                            className={`p-2 rounded-md transition-all ${viewMode === 'services' ? 'bg-white/10 text-white shadow-sm' : 'text-muted-foreground hover:text-white'}`}
                            title="Services View"
                        >
                            <LayoutGrid className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => setViewMode('infrastructure')}
                            className={`p-2 rounded-md transition-all ${viewMode === 'infrastructure' ? 'bg-white/10 text-white shadow-sm' : 'text-muted-foreground hover:text-white'}`}
                            title="Infrastructure View"
                        >
                            <Server className="w-4 h-4" />
                        </button>
                    </div>
                    <button 
                        onClick={() => setShowLaunchWizard(true)}
                        disabled={!can('create_services')}
                        className="bg-white text-black px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 hover:bg-white/90 transition-colors shadow-lg shadow-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Plus className="w-4 h-4" /> Launch New Service
                    </button>
                </div>
            </div>

            {viewMode === 'services' ? (
                <>
                    <div className="grid grid-cols-1 gap-6">
                        {services.map((service) => (
                            <ServiceCard
                                key={service.id}
                                service={service}
                                actionInProgress={actionInProgress}
                                onAction={handleAction}
                                onOpenTerminal={(service, instanceId) => setSelectedTerminal({ service, instanceId })}
                                onOpenDeploy={setSelectedDeployService}
                            />
                        ))}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-4">
                        <DeploymentHistory />
                        <EventStream />
                    </div>
                </>
            ) : (
                <InfrastructureView />
            )}

            {/* Terminal Modal Overlay */}
            {selectedTerminal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="w-full max-w-4xl relative">
                        <TerminalConsole
                            serviceId={selectedTerminal.service.id}
                            serviceName={selectedTerminal.service.name}
                            instanceId={selectedTerminal.instanceId}
                            node={(selectedTerminal.service.instance_details || selectedTerminal.service.instanceDetails)?.find(i => i.id === selectedTerminal.instanceId)?.node}
                            onClose={() => setSelectedTerminal(null)}
                        />
                    </div>
                </div>
            )}

            {/* Deployment Modal Overlay */}
            {selectedDeployService && (
                <DeploymentModal
                    service={selectedDeployService}
                    onClose={() => setSelectedDeployService(null)}
                    onSuccess={() => {
                        setServices(prev => prev.map(s => s.id === selectedDeployService.id ? { ...s, status: 'deploying' } : s));
                    }}
                />
            )}

            {/* Launch Wizard Overlay */}
            {showLaunchWizard && (
                <LaunchWizard
                    onClose={() => setShowLaunchWizard(false)}
                    onSuccess={() => {
                        refresh(); 
                    }}
                />
            )}
        </div>
    );
}

"use client";

import React, { useMemo, useState } from "react";
import { Loader2, Plus, LayoutGrid, Server, Play, Square, RefreshCcw, ExternalLink, Filter, ArrowDownWideNarrow } from "lucide-react";
import dynamic from 'next/dynamic';
import { cn } from "@/lib/utils";
import { usePermission } from "@/hooks/usePermission";
import { useServices } from "@/hooks/useServices";
import { Service } from "@/types/service";
import { ServiceCard } from "@/components/services/service-card";
import { DeploymentHistory } from "@/components/services/deployment-history";
import { EventStream } from "@/components/services/event-stream";
import { InfrastructureView } from "@/components/services/InfrastructureView";
import { GlobalStatsHeader } from "@/components/services/GlobalStatsHeader";
import { ServiceDetailsDrawer } from "@/components/services/ServiceDetailsDrawer";
import DeploymentModal from "@/components/services/deployment-modal";
import LaunchWizard from "@/components/services/wizard/LaunchWizard";

import RouterConfigModal from "@/components/services/router/RouterConfigModal";
import { ServiceFiltersToolbar } from "@/components/services/ServiceFiltersToolbar";
import AddNodeWizard from "@/components/services/wizard/AddNodeWizard";

const TerminalConsole = dynamic(() => import('@/components/services/terminal-console'), { ssr: false });

export default function ServicesPage() {
    const [selectedTerminal, setSelectedTerminal] = useState<{ service: Service, instanceId?: string } | null>(null);
    const [selectedDeployService, setSelectedDeployService] = useState<Service | null>(null);
    const [selectedRouterConfig, setSelectedRouterConfig] = useState<{ service: Service, instanceId: string } | null>(null);
    const [selectedDetails, setSelectedDetails] = useState<Service | null>(null);
    const [showLaunchWizard, setShowLaunchWizard] = useState(false);
    const [showAddNodeWizard, setShowAddNodeWizard] = useState(false);
    const [viewMode, setViewMode] = useState<'services' | 'infrastructure'>('services');

    // Filters & Sorting
    const [statusFilter, setStatusFilter] = useState<'all' | 'online' | 'offline' | 'archived'>('all');
    const [typeFilter, setTypeFilter] = useState<string>('all');
    const [regionFilter, setRegionFilter] = useState<string>('all');
    const [sortBy, setSortBy] = useState<'newest' | 'name' | 'instances'>('newest');

    // Memoize filters to prevent infinite re-renders and WebSocket reconnections in useServices
    const serviceFilters = useMemo(() => ({
        includeArchived: statusFilter === 'archived'
    }), [statusFilter]);

    const { services, loading, actionInProgress, handleAction, deleteService, setServices, refresh } = useServices(serviceFilters);


    const { loading: roleLoading, can } = usePermission();
    const canInfra = can('manage_infrastructure');
    const uniqueTypes = useMemo(() => Array.from(new Set(services.map(s => s.type))).filter(Boolean).sort(), [services]);
    const uniqueRegions = useMemo(() => Array.from(new Set(services.map(s => s.region))).filter(Boolean).sort(), [services]);
    const filteredServices = useMemo(() => services
        .filter(s => {
            const online = (s as any).is_online != null ? (s as any).is_online : s.status === 'online';
            if (statusFilter === 'online') return online;
            if (statusFilter === 'offline') return !online && !s.is_archived;
            if (statusFilter === 'archived') return s.is_archived;
            if (statusFilter === 'all') return !s.is_archived;
            return true;
        })
        .filter(s => typeFilter === 'all' || s.type === typeFilter)
        .filter(s => regionFilter === 'all' || s.region === regionFilter)
        .sort((a, b) => {
            switch (sortBy) {
                case 'name':
                    return a.name.localeCompare(b.name);
                case 'instances':
                    return (b.activeInstances || b.active_instances || 0) - (a.activeInstances || a.active_instances || 0);
                case 'newest':
                default:
                    return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
            }
        }), [services, statusFilter, typeFilter, regionFilter, sortBy]);

    if (loading || roleLoading) {
        return (
            <div className="h-[60vh] flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-10 h-10 text-purple-500 animate-spin" />
                    <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground animate-pulse">Initializing Command Center...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-[1400px] mx-auto px-4 md:px-8 space-y-10">
            {/* Unified Command Header */}
            <div className="flex flex-col gap-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-4xl font-black text-white mb-2 tracking-tighter uppercase">
                            Sovereign <span className="text-gradient">Control Center</span>
                        </h1>
                        <p className="text-sm text-muted-foreground font-medium border-l-2 border-purple-500/40 pl-4">
                            Real-time fleet orchestration and decentralized node management.
                        </p>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="flex bg-white/5 p-1.5 rounded-xl border border-white/5 backdrop-blur-md">
                            <button
                                onClick={() => setViewMode('services')}
                                className={cn(
                                    "px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all",
                                    viewMode === 'services' ? "bg-white/10 text-white shadow-lg" : "text-muted-foreground hover:text-white"
                                )}
                            >
                                Fleet
                            </button>
                            {canInfra && (
                                <button
                                    onClick={() => setViewMode('infrastructure')}
                                    className={cn(
                                        "px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all",
                                        viewMode === 'infrastructure' ? "bg-white/10 text-white shadow-lg" : "text-muted-foreground hover:text-white"
                                    )}
                                >
                                    Nodes
                                </button>
                            )}
                        </div>
                        <button
                            onClick={() => setShowLaunchWizard(true)}
                            disabled={!can('create_services')}
                            className="bg-white text-black h-[42px] px-6 rounded-xl font-black text-xs uppercase tracking-widest flex items-center gap-2 hover:bg-white/90 active:scale-95 transition-all shadow-xl shadow-white/5"
                        >
                            <Plus className="w-4 h-4 stroke-[3]" /> Launch
                        </button>
                    </div>
                </div>

                {/* Performance-Optimized Dashboard Stats */}
                <GlobalStatsHeader services={services} />
            </div>

            {viewMode === 'services' || !canInfra ? (
                <>
                    <ServiceFiltersToolbar
                        statusFilter={statusFilter}
                        setStatusFilter={setStatusFilter}
                        typeFilter={typeFilter}
                        setTypeFilter={setTypeFilter}
                        regionFilter={regionFilter}
                        setRegionFilter={setRegionFilter}
                        sortBy={sortBy}
                        setSortBy={setSortBy}
                        uniqueTypes={uniqueTypes}
                        uniqueRegions={uniqueRegions}
                    />

                    {/* High-Density Service Matrix */}
                    <div className="bento-grid">
                        {filteredServices.length === 0 && services.length > 0 ? (
                            <div className="col-span-full flex flex-col items-center justify-center py-12 text-muted-foreground border border-dashed border-white/10 rounded-3xl bg-white/5">
                                <Filter className="w-10 h-10 mb-3 opacity-20" />
                                <p className="text-sm font-medium">No services match your filters</p>
                                <button
                                    onClick={() => {
                                        setStatusFilter('all');
                                        setTypeFilter('all');
                                        setRegionFilter('all');
                                    }}
                                    className="mt-2 text-xs text-purple-400 hover:text-purple-300 transition-colors"
                                >
                                    Clear all filters
                                </button>
                            </div>
                        ) : (
                            filteredServices.map((service) => (
                                <ServiceCard
                                    key={service.id}
                                    service={service}
                                    actionInProgress={actionInProgress}
                                    onAction={handleAction}
                                    onOpenTerminal={(service, instanceId) => setSelectedTerminal({ service, instanceId })}
                                    onOpenDeploy={setSelectedDeployService}
                                    onOpenRouterConfig={(service, instanceId) => setSelectedRouterConfig({ service, instanceId })}
                                    onDetails={setSelectedDetails}
                                    onRemove={deleteService}
                                />
                            ))
                        )}

                        {/* Empty State / Add Card */}
                        <button
                            onClick={() => setShowLaunchWizard(true)}
                            className="glass-card border-dashed border-white/10 flex flex-col items-center justify-center gap-4 group opacity-40 hover:opacity-100 transition-all min-h-[400px]"
                        >
                            <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                                <Plus className="w-6 h-6 text-muted-foreground" />
                            </div>
                            <span className="bento-item-header">Add New Service</span>
                        </button>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-4">
                        <DeploymentHistory />
                        <EventStream />
                    </div>
                </>
            ) : (
                <InfrastructureView onShowAddWizard={() => setShowAddNodeWizard(true)} />
            )}

            {/* Terminal Modal Overlay */}
            {
                selectedTerminal && (
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
                )
            }

            {/* Deployment Modal Overlay */}
            {
                selectedDeployService && (
                    <DeploymentModal
                        service={selectedDeployService}
                        onClose={() => setSelectedDeployService(null)}
                        onSuccess={() => {
                            setServices(prev => prev.map(s => s.id === selectedDeployService.id ? { ...s, status: 'deploying' } : s));
                        }}
                    />
                )
            }

            {/* Launch Wizard Overlay */}
            {
                showLaunchWizard && (
                    <LaunchWizard
                        onClose={() => setShowLaunchWizard(false)}
                        onSuccess={() => {
                            refresh();
                        }}
                    />
                )
            }

            {/* Add Node Wizard Overlay */}
            {
                showAddNodeWizard && (
                    <AddNodeWizard 
                        onClose={() => setShowAddNodeWizard(false)} 
                        onSuccess={() => {
                            // Signal infrastructure view to refresh if needed
                            // For now we'll just close it
                        }} 
                    />
                )
            }

            {/* Router Configuration Modal */}
            {
                selectedRouterConfig && (
                    <RouterConfigModal
                        service={selectedRouterConfig.service}
                        instanceId={selectedRouterConfig.instanceId}
                        onClose={() => setSelectedRouterConfig(null)}
                    />
                )
            }

            {/* Service Details Drawer */}
            {
                selectedDetails && (
                    <ServiceDetailsDrawer
                        service={selectedDetails}
                        isOpen={!!selectedDetails}
                        onClose={() => setSelectedDetails(null)}
                        onOpenTerminal={(instanceId) => setSelectedTerminal({ service: selectedDetails, instanceId })}
                    />
                )
            }
        </div >
    );
}

import React, { useState } from 'react';
import DeploymentModal from '../modal/DeploymentModal';
import { ServiceHeader } from './ServiceHeader';
import { ServiceActions } from './ServiceActions';
import { InstanceList } from './InstanceList';

interface ServiceControlCardProps {
    service: any;
    onRefresh: () => void;
}

export default function ServiceControlCard({ service, onRefresh }: ServiceControlCardProps) {
    const [loading, setLoading] = useState(false);
    const [showSettings, setShowSettings] = useState(false);

    const handleAction = async (action: 'start' | 'stop' | 'restart') => {
        setLoading(true);
        try {
            const res = await fetch('/api/services/orchestration', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ serviceId: service.id, action })
            });
            
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Action failed');
            }
            
            // Allow some time for state to propagate or just refresh immediately
            setTimeout(onRefresh, 1000);
        } catch (error) {
            console.error(error);
            // Optionally show toast error
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <div className="glass-card p-0 flex flex-col group hover:border-white/20 transition-all duration-300 overflow-hidden h-full shadow-lg hover:shadow-xl hover:shadow-purple-500/5 hover:-translate-y-1">
                <div className="p-6 pb-4 flex-1 flex flex-col">
                    <ServiceHeader 
                        name={service.name} 
                        type={service.type} 
                        region={service.region}
                        status={service.status}
                        health={service.health}
                        loading={loading}
                    />

                    <ServiceActions 
                        status={service.status}
                        loading={loading}
                        onAction={handleAction}
                        onConfigure={() => setShowSettings(true)}
                    />
                </div>
                
                <InstanceList service={service} />
            </div>

            {showSettings && (
                <DeploymentModal 
                    service={service} 
                    onClose={() => setShowSettings(false)} 
                    onSuccess={onRefresh}
                />
            )}
        </>
    );
}

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { Service, ServiceAction } from "@/types/service";
import { useServicesStore } from "@/store/services";

export interface ServiceFilters {
    includeArchived?: boolean;
    type?: string;
    region?: string;
}

export function useServices(filters: ServiceFilters = {}) {
    const [services, setServices] = useState<Service[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionInProgress, setActionInProgress] = useState<string | null>(null);
    const supabase = createClient();
    const upsertServices = useServicesStore(s => s.upsertServices);
    const setInflight = useServicesStore(s => s.setInflight);
    const getList = useServicesStore(s => s.getList);
    const removeService = useServicesStore(s => s.removeService);

    const fetchServices = async () => {
        try {
            const params = new URLSearchParams();
            if (filters.includeArchived) params.set('include_archived', 'true');
            if (filters.type && filters.type !== 'all') params.set('type', filters.type);
            if (filters.region && filters.region !== 'all') params.set('region', filters.region);

            // Fetch from API to get enriched data (instance details, Docker status)
            const response = await fetch(`/api/services?${params.toString()}`);
            if (!response.ok) throw new Error('Failed to fetch services');

            const data = await response.json();
            upsertServices(data);
            setServices(getList() as Service[]);
        } catch (error) {
            console.error('Error fetching services:', error);
            // Fallback: fetch from Supabase if API fails (though instance details will be missing)
            let query = supabase.from('services').select('*').order('name');
            
            if (!filters.includeArchived) {
                query = query.eq('is_archived', false);
            }
            if (filters.type && filters.type !== 'all') {
                query = query.eq('type', filters.type);
            }
            if (filters.region && filters.region !== 'all') {
                query = query.eq('region', filters.region);
            }

            const { data } = await query;
            if (data) {
                upsertServices(data);
                setServices(getList() as Service[]);
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchServices();

        // WebSocket live services stream
        let ws: WebSocket | null = null;
        try {
            ws = new WebSocket(`${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.host}/api/ws/services`);
            ws.onmessage = (ev) => {
                try {
                    const msg = JSON.parse(ev.data);
                    if (msg.type === 'services') {
                        upsertServices(msg.data);
                        setServices(getList() as Service[]);
                    }
                } catch {}
            };
        } catch {}

        const channel = supabase
            .channel('schema-db-changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'services' }, (payload) => {
                fetchServices();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
            try { ws?.close(); } catch {}
        };
    }, [filters.includeArchived, filters.type, filters.region, upsertServices]);

    const handleAction = async (serviceId: string, action: ServiceAction, instanceId?: string) => {
        // If acting on specific instance, don't block the whole service card UI
        if (!instanceId) {
            setActionInProgress(serviceId);
            setInflight(serviceId, action);
        }

        try {
            const resp = await fetch('/api/services/orchestration', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ serviceId, action, instanceId })
            });

            if (!resp.ok) {
                // Handle 404 (Service deleted remotely)
                if (resp.status === 404) {
                    if (!instanceId) {
                        removeService(serviceId);
                        setServices(prev => prev.filter(s => s.id !== serviceId));
                        throw new Error('Service no longer exists');
                    }
                }

                const err = await resp.json();
                throw new Error(err.error || 'Action failed');
            }

            // Refresh to get updated status
            setTimeout(fetchServices, 1000);
        } catch (err: any) {
            console.error(`Service action failed: ${err.message}`);
            // Don't alert if it's just "Service no longer exists", the UI update is enough
            if (err.message !== 'Service no longer exists') {
                alert(`Service action failed: ${err.message}`);
            }
        } finally {
            if (!instanceId) {
                setActionInProgress(null);
                setInflight(serviceId, null);
            }
        }
    };

    const deleteService = async (serviceId: string) => {
        setActionInProgress(serviceId);
        try {
            const resp = await fetch(`/api/services?id=${serviceId}`, {
                method: 'DELETE'
            });

            if (!resp.ok) {
                const err = await resp.json();
                throw new Error(err.error || 'Delete failed');
            }

            // Remove from local state immediately for snappy UI
            removeService(serviceId);
            setServices(prev => prev.filter(s => s.id !== serviceId));
        } catch (err: any) {
            console.error(`Delete failed: ${err.message}`);
            alert(`Delete failed: ${err.message}`);
        } finally {
            setActionInProgress(null);
        }
    };

    return {
        services,
        loading,
        actionInProgress,
        handleAction,
        deleteService,
        refresh: fetchServices,
        setServices
    };
}

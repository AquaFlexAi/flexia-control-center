import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { Service, ServiceAction } from "@/types/service";

export function useServices() {
    const [services, setServices] = useState<Service[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionInProgress, setActionInProgress] = useState<string | null>(null);
    const supabase = createClient();

    const fetchServices = async () => {
        try {
            // Fetch from API to get enriched data (instance details, Docker status)
            const response = await fetch('/api/services');
            if (!response.ok) throw new Error('Failed to fetch services');
            
            const data = await response.json();
            setServices(data as Service[]);
        } catch (error) {
            console.error('Error fetching services:', error);
            // Fallback: fetch from Supabase if API fails (though instance details will be missing)
            const { data } = await supabase.from('services').select('*').order('name');
            if (data) setServices(data as Service[]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchServices();

        const channel = supabase
            .channel('schema-db-changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'services' }, (payload) => {
                fetchServices();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const handleAction = async (serviceId: string, action: ServiceAction, instanceId?: string) => {
        // If acting on specific instance, don't block the whole service card UI
        if (!instanceId) {
            setActionInProgress(serviceId);
        }
        
        try {
            const resp = await fetch('/api/services/orchestration', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ serviceId, action, instanceId })
            });

            if (!resp.ok) {
                const err = await resp.json();
                throw new Error(err.error || 'Action failed');
            }
            
            // Refresh to get updated status
            setTimeout(fetchServices, 1000);
        } catch (err: any) {
            console.error(`Service action failed: ${err.message}`);
            alert(`Service action failed: ${err.message}`);
        } finally {
            if (!instanceId) {
                setActionInProgress(null);
            }
        }
    };

    return {
        services,
        loading,
        actionInProgress,
        handleAction,
        refresh: fetchServices,
        setServices
    };
}

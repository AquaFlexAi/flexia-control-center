"use client";

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { type Role, type Permission, hasPermission } from '@/utils/rbac';

export function usePermission() {
    const [role, setRole] = useState<Role | null>(null);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    useEffect(() => {
        async function fetchRole() {
            try {
                const { data: { user } } = await supabase.auth.getUser();

                if (!user) {
                    setRole(null);
                    return;
                }

                const { data, error } = await supabase
                    .from('organization_members')
                    .select('role')
                    .eq('email', user.email)
                    .single();

                if (data && !error) {
                    setRole(data.role as Role);
                } else {
                    setRole('viewer'); // Default fallback
                }
            } catch (err) {
                console.error('RBAC Error:', err);
                setRole('viewer');
            } finally {
                setLoading(false);
            }
        }

        fetchRole();
    }, []);

    const can = (permission: Permission) => {
        if (loading) return false; // Fail safe while loading
        return hasPermission(role as Role, permission);
    };

    return { role, loading, can };
}

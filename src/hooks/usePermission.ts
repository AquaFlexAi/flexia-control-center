"use client";

import { useEffect, useState } from 'react';
import { type Role, type Permission } from '@/utils/rbac';

export function usePermission() {
    const [role, setRole] = useState<Role | null>(null);
    const [permissions, setPermissions] = useState<Permission[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;
        
        async function fetchPermissions() {
            console.log('[usePermission] Fetching permissions...');
            try {
                const res = await fetch('/api/auth/permissions');
                if (res.ok) {
                    const data = await res.json();
                    if (isMounted) {
                        console.log('[usePermission] Permissions loaded:', data.role, `(${data.permissions?.length || 0} perms)`);
                        setRole(data.role);
                        setPermissions(data.permissions || []);
                    }
                } else {
                    console.warn('[usePermission] Failed to fetch permissions:', res.status);
                    if (isMounted) {
                        setRole(null);
                        setPermissions([]);
                    }
                }
            } catch (err) {
                console.error('[usePermission] RBAC fetch error:', err);
                if (isMounted) {
                    setRole(null);
                }
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        }

        fetchPermissions();
        return () => { isMounted = false; };
    }, []);

    const can = (permission: Permission) => {
        if (loading) return false;
        if (!role) return false;
        // System Admin bypass
        if (role === 'system_admin') return true;
        return permissions.includes(permission);
    };

    return { role, loading, can };
}

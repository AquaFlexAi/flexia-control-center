"use client";

import { useEffect, useState } from 'react';
import { type Role, type Permission } from '@/utils/rbac';

export function usePermission() {
    const [role, setRole] = useState<Role | null>(null);
    const [permissions, setPermissions] = useState<Permission[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchPermissions() {
            try {
                const res = await fetch('/api/auth/permissions');
                if (res.ok) {
                    const data = await res.json();
                    setRole(data.role);
                    setPermissions(data.permissions);
                } else {
                    setRole(null);
                    setPermissions([]);
                }
            } catch (err) {
                console.error('RBAC Error:', err);
                setRole(null);
            } finally {
                setLoading(false);
            }
        }

        fetchPermissions();
    }, []);

    const can = (permission: Permission) => {
        if (loading) return false;
        // System Admin bypass (optional, but good for UI consistency)
        if (role === 'system_admin') return true;
        return permissions.includes(permission);
    };

    return { role, loading, can };
}

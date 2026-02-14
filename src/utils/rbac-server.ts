import { createAdminClient } from './supabase/server';
import { Database } from '@/types/database.types';

export async function checkPermission(userId: string, permission: string): Promise<boolean> {
    // For MVP, simplistic check or integrate with your rbac.ts logic
    // Ideally fetch user role from DB and check against PERMISSIONS
    return true;
}

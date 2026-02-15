import { Role } from '@/utils/rbac';

export interface OrganizationMember {
  id: string;
  name: string;
  email: string;
  role: Role;
  last_activity?: string;
  joined_at?: string;
  color?: string;
}

export interface RoleDefinition {
  key: string;
  name: string;
  description?: string;
  created_at: string;
}

export interface PermissionDefinition {
  key: string;
  description?: string;
  module?: string;
  created_at: string;
}

export interface RolePermission {
  role_key: string;
  permission_key: string;
  created_at: string;
}

export interface AuthPermissionsResponse {
  role: Role | null;
  permissions: string[];
  error?: string;
}

export interface LoginResponse {
  user?: any; // Supabase User type is complex, using any or generic object for now if not importing from supabase-js
  session?: any;
  error?: string;
  details?: string;
}

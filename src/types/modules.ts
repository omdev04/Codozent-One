// ==============================================================================
// CODOZENT PLATFORM CORE - MODULAR ARCHITECTURE & RBAC DOMAIN TYPES
// ==============================================================================

import { ERPRole } from './erp';

export type ModuleCategory =
  | 'Core Platform'
  | 'Sales & CRM'
  | 'Supply Chain'
  | 'Manufacturing'
  | 'Finance & Tax'
  | 'Human Capital'
  | 'Operations & Services';

export type ModuleLifecycleState =
  | 'available'
  | 'enabled'
  | 'disabled'
  | 'suspended'
  | 'error';

export type UserVerificationStatus =
  | 'pending_verification'
  | 'email_verified_only'
  | 'phone_verified_only'
  | 'active'
  | 'suspended';

export type PermissionAction =
  | 'read'
  | 'create'
  | 'update'
  | 'delete'
  | 'approve'
  | 'export'
  | 'admin';

export type PermissionScope =
  | 'own'
  | 'team'
  | 'branch'
  | 'company'
  | 'tenant';

export interface ModuleDependency {
  moduleId: string;
  minVersion?: string;
  isRequired: boolean;
  purpose: string;
}

export interface PermissionDefinition {
  id: string; // e.g. 'crm.leads.create'
  moduleId: string;
  resource: string;
  action: PermissionAction;
  description: string;
  availableScopes: PermissionScope[];
}

export interface ERPModuleManifest {
  id: string;
  name: string;
  version: string;
  description: string;
  category: ModuleCategory;
  iconName: string;
  badge?: string;
  isCore: boolean;
  capabilities: string[];
  dependencies: ModuleDependency[];
  optionalDependencies: ModuleDependency[];
  permissions: PermissionDefinition[];
  defaultSettings?: Record<string, any>;
  supportedIndustries?: string[];
}

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  subscriptionTier: 'starter' | 'professional' | 'enterprise';
  status: 'active' | 'suspended' | 'trial';
  createdAt: string;
}

export interface Branch {
  id: string;
  companyId: string;
  name: string;
  code: string;
  address?: string;
  city: string;
  state: string;
  pincode?: string;
  phone?: string;
  isMain: boolean;
  createdAt: string;
}

export interface CompanyModule {
  id: string;
  companyId: string;
  moduleId: string;
  status: ModuleLifecycleState;
  settings: Record<string, any>;
  activatedAt?: string;
  activatedBy?: string;
  updatedAt: string;
}

export interface CompanyRole {
  id: string;
  companyId: string;
  name: string;
  code: string;
  description: string;
  isSystem: boolean;
  isActive: boolean;
  createdAt: string;
}

export interface RolePermission {
  id: string;
  roleId: string;
  permissionId: string;
  scope: PermissionScope;
  conditions?: Record<string, any>; // ABAC rule definitions (e.g. maxApprovalAmount)
}

export interface UserRoleAssignment {
  id: string;
  userId: string;
  companyId: string;
  roleId: string;
  branchId?: string;
  scope: PermissionScope;
  assignedBy?: string;
  assignedAt: string;
}

export interface AccessAllotmentRequest {
  companyId: string;
  name: string;
  email: string;
  phone: string;
  roleId: string;
  branchId?: string;
  department: string;
  scope: PermissionScope;
}

export interface UserVerificationPayload {
  userId: string;
  companyId: string;
  emailOtp?: string;
  phoneOtp?: string;
}

import { CompanyUser, ERPRole } from '../types/erp';
import { PermissionScope, RolePermission, UserVerificationStatus } from '../types/modules';
import { getModuleManifest } from './moduleRegistry';

// ==============================================================================
// CODOZENT CENTRALIZED AUTHORIZATION ENGINE
// Granular RBAC + Contextual ABAC + Mandatory Email & Phone Verification Gate
// ==============================================================================

export interface AuthorizationContext {
  user: CompanyUser | null;
  activeCompanyId: string;
  activeBranchId?: string;
  enabledModules: string[];
  userPermissions?: string[]; // Explicit permissions list if loaded
}

export interface AccessCheckRequest {
  permissionId: string; // e.g. 'sales.orders.create' or 'crm.leads.read'
  moduleId?: string;    // e.g. 'sales'
  resourceScope?: PermissionScope;
  recordBranchId?: string;
  recordCreatedBy?: string;
  recordAmount?: number;
}

export interface AccessDecision {
  allowed: boolean;
  reason?: string;
  requiresVerification?: boolean;
}

/**
 * Standard Role-to-Permissions Mapping for Default Templates
 */
export const DEFAULT_ROLE_PERMISSIONS: Record<ERPRole, string[]> = {
  super_admin: ['*'], // Wildcard - unrestricted platform governance
  owner: ['*'],       // Wildcard - enterprise tenant owner full access
  admin: [
    'platform.modules.manage',
    'platform.roles.manage',
    'platform.users.invite',
    'platform.audit.read',
    'crm.*',
    'sales.*',
    'purchase.*',
    'inventory.*',
    'manufacturing.*',
    'quality.*',
    'finance.*',
    'khatabook.*',
    'gst.*',
    'hrms.*',
    'support.*',
    'reports.*'
  ],
  finance_manager: [
    'finance.*',
    'gst.*',
    'khatabook.*',
    'sales.quotations.read',
    'sales.orders.read',
    'sales.invoices.*',
    'purchase.orders.read',
    'purchase.grn.read',
    'reports.*'
  ],
  sales_manager: [
    'crm.*',
    'sales.quotations.*',
    'sales.orders.*',
    'counter.*',
    'reports.analytics.read'
  ],
  sales_executive: [
    'crm.leads.read',
    'crm.leads.create',
    'crm.leads.update',
    'sales.quotations.read',
    'sales.quotations.create',
    'sales.quotations.update',
    'sales.orders.read',
    'sales.orders.create',
    'counter.pos.create'
  ],
  purchase_manager: [
    'purchase.*',
    'inventory.items.read',
    'inventory.stock.read',
    'reports.analytics.read'
  ],
  inventory_manager: [
    'inventory.*',
    'purchase.grn.post',
    'reports.analytics.read'
  ],
  production_manager: [
    'manufacturing.*',
    'shopfloor.*',
    'inventory.items.read',
    'inventory.stock.read',
    'quality.inspections.read',
    'sales.orders.read',
    'reports.analytics.read'
  ],
  purchase_user: [
    'purchase.orders.read',
    'purchase.orders.create',
    'purchase.grn.post'
  ],
  storekeeper: [
    'inventory.items.read',
    'inventory.stock.adjust',
    'inventory.stock.transfer',
    'purchase.grn.post'
  ],
  supervisor: [
    'manufacturing.orders.create',
    'shopfloor.terminal.operate',
    'quality.inspections.create'
  ],
  worker: [
    'shopfloor.terminal.operate'
  ],
  qc_inspector: [
    'quality.inspections.read',
    'quality.inspections.create'
  ],
  accountant: [
    'finance.ledger.read',
    'finance.vouchers.create',
    'sales.invoices.create',
    'khatabook.entries.read',
    'khatabook.entries.create',
    'gst.returns.read',
    'reports.*'
  ],
  hr_manager: [
    'hrms.*',
    'support.tickets.read',
    'reports.analytics.read'
  ],
  viewer: [
    'crm.leads.read',
    'sales.quotations.read',
    'sales.orders.read',
    'purchase.orders.read',
    'inventory.items.read',
    'manufacturing.bom.read',
    'quality.inspections.read',
    'finance.ledger.read',
    'cadesk.audit.read',
    'hrms.employees.read',
    'support.tickets.read',
    'reports.analytics.read'
  ]
};

/**
 * Check if a user's phone and email are verified.
 * Mandatory Gate: Unverified users cannot execute privileged business actions.
 */
export const isUserVerified = (user: CompanyUser | null): boolean => {
  if (!user) return false;
  // If test account or owner, bypass for local dev flexibility
  if (user.role === 'owner' || user.role === 'super_admin' || user.isTestAccount) {
    return true;
  }
  // Standard enterprise user verification
  return Boolean(user.isEmailVerified && user.isPhoneVerified);
};

/**
 * Core Authorization Decision Engine
 */
export const evaluateAccess = (
  ctx: AuthorizationContext,
  req: AccessCheckRequest
): AccessDecision => {
  const { user, activeCompanyId, activeBranchId, enabledModules, userPermissions } = ctx;

  // 1. Must be authenticated
  if (!user) {
    return { allowed: false, reason: 'Unauthenticated session' };
  }

  // 2. User account must be active
  if (!user.isActive) {
    return { allowed: false, reason: 'User account has been deactivated' };
  }

  // 3. User must have access to active company
  if (user.companyId !== activeCompanyId && (!user.companyIds || !user.companyIds.includes(activeCompanyId))) {
    return { allowed: false, reason: 'User does not belong to active company' };
  }

  // 4. Verification Check (Supabase email + phone verification gate)
  if (!isUserVerified(user)) {
    return {
      allowed: false,
      reason: 'Access restricted: Please complete your Email and Phone verification to activate allotted roles',
      requiresVerification: true
    };
  }

  // 5. Module Activation Check
  let targetModuleId = req.moduleId;
  if (!targetModuleId && req.permissionId.includes('.')) {
    targetModuleId = req.permissionId.split('.')[0];
  }

  if (targetModuleId && targetModuleId !== 'platform' && targetModuleId !== 'dashboard') {
    if (!enabledModules.includes(targetModuleId)) {
      return { allowed: false, reason: `Module '${targetModuleId}' is disabled for this company` };
    }
  }

  // 6. Super Admin & Owner Wildcard Pass
  if (user.role === 'super_admin' || user.role === 'owner') {
    return { allowed: true };
  }

  // 7. Resolve Effective Permissions
  const rolePermissions = DEFAULT_ROLE_PERMISSIONS[user.role] || [];
  const effectivePermissions = [...rolePermissions, ...(userPermissions || [])];

  const hasPerm = effectivePermissions.some(perm => {
    if (perm === '*' || perm === req.permissionId) return true;
    if (perm.endsWith('.*')) {
      const prefix = perm.slice(0, -2);
      return req.permissionId.startsWith(prefix);
    }
    return false;
  });

  if (!hasPerm) {
    return { allowed: false, reason: `Missing required permission: ${req.permissionId}` };
  }

  // 8. Scope & Branch Segregation Check
  if (req.resourceScope === 'branch' && req.recordBranchId && activeBranchId) {
    if (user.branchId && user.branchId !== req.recordBranchId) {
      return { allowed: false, reason: 'Record belongs to a different branch' };
    }
  }

  if (req.resourceScope === 'own' && req.recordCreatedBy) {
    if (user.id !== req.recordCreatedBy && user.role === 'sales_executive') {
      return { allowed: false, reason: 'Restricted to own records only' };
    }
  }

  // 9. Contextual ABAC Rule: Approval Threshold
  if (req.permissionId.endsWith('.approve') && req.recordAmount) {
    if (user.role === 'sales_executive') {
      return { allowed: false, reason: 'Sales executives cannot approve quotation proposals' };
    }
  }

  return { allowed: true };
};

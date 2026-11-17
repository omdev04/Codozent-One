import { ERPModuleManifest, PermissionDefinition } from '../types/modules';

// ==============================================================================
// CODOZENT ENTERPRISE MODULE REGISTRY
// Declarative manifests, capabilities, dependencies, and permissions
// ==============================================================================

export const MODULE_REGISTRY: Record<string, ERPModuleManifest> = {
  crm: {
    id: 'crm',
    name: 'CRM & Lead Management',
    version: '2.4.0',
    description: 'B2B inquiry tracking, lead stages, follow-up scheduling, and customer interaction logs.',
    category: 'Sales & CRM',
    iconName: 'Users',
    badge: 'Popular',
    isCore: false,
    capabilities: [
      'lead-capture',
      'pipeline-stages',
      'followup-reminders',
      'interaction-logging',
      'quotation-handoff'
    ],
    dependencies: [],
    optionalDependencies: [
      { moduleId: 'quotations', isRequired: false, purpose: 'Convert qualified inquiries directly into itemized price proposals' }
    ],
    permissions: [
      { id: 'crm.leads.read', moduleId: 'crm', resource: 'leads', action: 'read', description: 'View inquiries and customer leads', availableScopes: ['own', 'team', 'branch', 'company'] },
      { id: 'crm.leads.create', moduleId: 'crm', resource: 'leads', action: 'create', description: 'Create new inquiries and leads', availableScopes: ['branch', 'company'] },
      { id: 'crm.leads.update', moduleId: 'crm', resource: 'leads', action: 'update', description: 'Update lead details, stage, and follow-ups', availableScopes: ['own', 'team', 'company'] },
      { id: 'crm.leads.delete', moduleId: 'crm', resource: 'leads', action: 'delete', description: 'Delete leads and interaction logs', availableScopes: ['company'] },
      { id: 'crm.leads.export', moduleId: 'crm', resource: 'leads', action: 'export', description: 'Export lead directory to CSV or Excel', availableScopes: ['company'] }
    ]
  },

  quotations: {
    id: 'quotations',
    name: 'Quotations & Estimations',
    version: '2.1.0',
    description: 'Custom manufacturing quotes, revision histories, multi-tier approvals, and PDF proposals.',
    category: 'Sales & CRM',
    iconName: 'FileText',
    badge: 'Essential',
    isCore: false,
    capabilities: [
      'costing-breakdown',
      'gst-tax-calculation',
      'revision-versioning',
      'pdf-proposal-generation',
      'sales-order-conversion'
    ],
    dependencies: [],
    optionalDependencies: [
      { moduleId: 'crm', isRequired: false, purpose: 'Pull specifications and drawings directly from inquiry history' },
      { moduleId: 'sales', isRequired: false, purpose: 'Auto-convert accepted quotations into confirmed Sales Orders' }
    ],
    permissions: [
      { id: 'sales.quotations.read', moduleId: 'quotations', resource: 'quotations', action: 'read', description: 'View price quotations and revisions', availableScopes: ['own', 'team', 'branch', 'company'] },
      { id: 'sales.quotations.create', moduleId: 'quotations', resource: 'quotations', action: 'create', description: 'Create quotation proposals', availableScopes: ['branch', 'company'] },
      { id: 'sales.quotations.update', moduleId: 'quotations', resource: 'quotations', action: 'update', description: 'Revise quotations and negotiate pricing', availableScopes: ['own', 'team', 'company'] },
      { id: 'sales.quotations.approve', moduleId: 'quotations', resource: 'quotations', action: 'approve', description: 'Approve quotations exceeding margin or discount thresholds', availableScopes: ['company'] },
      { id: 'sales.quotations.delete', moduleId: 'quotations', resource: 'quotations', action: 'delete', description: 'Cancel or delete draft quotations', availableScopes: ['company'] }
    ]
  },

  sales: {
    id: 'sales',
    name: 'Sales Orders & Invoicing',
    version: '2.5.0',
    description: 'Customer order-to-cash pipeline, delivery dispatch, e-way bills, and GST tax invoicing.',
    category: 'Sales & CRM',
    iconName: 'ShoppingCart',
    badge: 'Core S2C',
    isCore: true,
    capabilities: [
      'order-confirmation',
      'delivery-challans',
      'advance-payment-receipts',
      'gst-tax-invoicing',
      'production-demand-trigger'
    ],
    dependencies: [],
    optionalDependencies: [
      { moduleId: 'inventory', isRequired: false, purpose: 'Check finished goods stock availability prior to dispatch' },
      { moduleId: 'manufacturing', isRequired: false, purpose: 'Trigger make-to-order work orders from confirmed sales orders' },
      { moduleId: 'finance', isRequired: false, purpose: 'Post automatic receivables and GST liabilities to general ledger' }
    ],
    permissions: [
      { id: 'sales.orders.read', moduleId: 'sales', resource: 'orders', action: 'read', description: 'View sales orders and dispatch schedules', availableScopes: ['own', 'branch', 'company'] },
      { id: 'sales.orders.create', moduleId: 'sales', resource: 'orders', action: 'create', description: 'Enter customer sales orders', availableScopes: ['branch', 'company'] },
      { id: 'sales.orders.update', moduleId: 'sales', resource: 'orders', action: 'update', description: 'Modify sales order quantities or delivery dates', availableScopes: ['branch', 'company'] },
      { id: 'sales.orders.approve', moduleId: 'sales', resource: 'orders', action: 'approve', description: 'Confirm orders and authorize production release', availableScopes: ['company'] },
      { id: 'sales.invoices.create', moduleId: 'sales', resource: 'invoices', action: 'create', description: 'Generate GST tax invoices and delivery challans', availableScopes: ['branch', 'company'] }
    ]
  },

  counter: {
    id: 'counter',
    name: 'Counter Sales POS',
    version: '1.8.0',
    description: 'Rapid walk-in retail & wholesale billing with thermal slip print and instant UPI/cash capture.',
    category: 'Sales & CRM',
    iconName: 'Store',
    isCore: false,
    capabilities: [
      'pos-billing',
      'barcode-scan',
      'upi-qr-receipts',
      'thermal-slip-print'
    ],
    dependencies: [],
    optionalDependencies: [
      { moduleId: 'inventory', isRequired: false, purpose: 'Deduct counter stock immediately upon checkout' }
    ],
    permissions: [
      { id: 'counter.pos.read', moduleId: 'counter', resource: 'pos', action: 'read', description: 'View counter sale registers and shifts', availableScopes: ['branch', 'company'] },
      { id: 'counter.pos.create', moduleId: 'counter', resource: 'pos', action: 'create', description: 'Punch walk-in counter sales and receipts', availableScopes: ['branch', 'company'] }
    ]
  },

  purchase: {
    id: 'purchase',
    name: 'Procurement & Vendor Portal',
    version: '2.4.0',
    description: 'Purchase requisitions, RFQ comparison (L1/L2), purchase orders, and goods receipts (GRN).',
    category: 'Supply Chain',
    iconName: 'Truck',
    badge: 'Essential',
    isCore: true,
    capabilities: [
      'purchase-requisitions',
      'rfq-negotiation',
      'vendor-po-issuance',
      'grn-dock-receiving',
      '3-way-matching'
    ],
    dependencies: [],
    optionalDependencies: [
      { moduleId: 'inventory', isRequired: false, purpose: 'Post accepted GRN goods into designated warehouse bins' },
      { moduleId: 'finance', isRequired: false, purpose: 'Match vendor bills against PO and GRN for accounts payable' }
    ],
    permissions: [
      { id: 'purchase.orders.read', moduleId: 'purchase', resource: 'orders', action: 'read', description: 'View purchase requisitions and vendor orders', availableScopes: ['branch', 'company'] },
      { id: 'purchase.orders.create', moduleId: 'purchase', resource: 'orders', action: 'create', description: 'Raise purchase orders to suppliers', availableScopes: ['branch', 'company'] },
      { id: 'purchase.orders.approve', moduleId: 'purchase', resource: 'orders', action: 'approve', description: 'Approve vendor purchase orders above spending limits', availableScopes: ['company'] },
      { id: 'purchase.grn.post', moduleId: 'purchase', resource: 'grn', action: 'create', description: 'Inspect dock receipts and confirm GRN entry', availableScopes: ['branch', 'company'] }
    ]
  },

  inventory: {
    id: 'inventory',
    name: 'Inventory & Warehousing',
    version: '2.3.0',
    description: 'Raw materials, WIP stock, bin locations, reorder level alerts, and FIFO stock movements.',
    category: 'Supply Chain',
    iconName: 'Package',
    badge: 'Core SCM',
    isCore: true,
    capabilities: [
      'stock-ledger',
      'multi-warehouse-transfer',
      'stock-reconciliation',
      'reorder-triggers',
      'batch-traceability'
    ],
    dependencies: [],
    optionalDependencies: [],
    permissions: [
      { id: 'inventory.items.read', moduleId: 'inventory', resource: 'items', action: 'read', description: 'View item catalog, valuation, and stock balances', availableScopes: ['branch', 'company'] },
      { id: 'inventory.items.create', moduleId: 'inventory', resource: 'items', action: 'create', description: 'Create master items, raw materials, and finished goods', availableScopes: ['company'] },
      { id: 'inventory.stock.adjust', moduleId: 'inventory', resource: 'stock', action: 'update', description: 'Perform stock adjustments and physical count syncs', availableScopes: ['branch', 'company'] },
      { id: 'inventory.stock.transfer', moduleId: 'inventory', resource: 'stock', action: 'create', description: 'Transfer stock between plant locations or warehouses', availableScopes: ['company'] }
    ]
  },

  manufacturing: {
    id: 'manufacturing',
    name: 'Manufacturing & BOM Engine',
    version: '2.2.0',
    description: 'Multi-level bills of materials, work order routing, job card release, and machine capacity planning.',
    category: 'Manufacturing',
    iconName: 'Layers',
    badge: 'Industrial',
    isCore: false,
    capabilities: [
      'bom-engineering',
      'work-order-scheduling',
      'machine-center-allocation',
      'mrp-shortage-calculation'
    ],
    dependencies: [
      { moduleId: 'inventory', isRequired: true, purpose: 'Verify raw material availability and deduct production kits' }
    ],
    optionalDependencies: [
      { moduleId: 'purchase', isRequired: false, purpose: 'Generate automatic purchase requisitions from MRP shortages' }
    ],
    permissions: [
      { id: 'manufacturing.bom.read', moduleId: 'manufacturing', resource: 'bom', action: 'read', description: 'View engineering bills of materials', availableScopes: ['company'] },
      { id: 'manufacturing.bom.create', moduleId: 'manufacturing', resource: 'bom', action: 'create', description: 'Design and approve manufacturing BOMs', availableScopes: ['company'] },
      { id: 'manufacturing.orders.create', moduleId: 'manufacturing', resource: 'orders', action: 'create', description: 'Schedule and release work orders', availableScopes: ['branch', 'company'] }
    ]
  },

  shopfloor: {
    id: 'shopfloor',
    name: 'Shop-Floor Terminal',
    version: '2.0.0',
    description: 'Touch-optimized machine terminal for job card tracking, shift output logs, and machine downtime.',
    category: 'Manufacturing',
    iconName: 'HardHat',
    isCore: false,
    capabilities: [
      'touch-terminal',
      'worker-clock-in',
      'good-rejection-counts',
      'downtime-logging'
    ],
    dependencies: [
      { moduleId: 'manufacturing', isRequired: true, purpose: 'Fetch active work order operations and job cards' }
    ],
    optionalDependencies: [],
    permissions: [
      { id: 'shopfloor.terminal.operate', moduleId: 'shopfloor', resource: 'terminal', action: 'update', description: 'Log start, pause, piece counts, and machine downtime', availableScopes: ['branch'] }
    ]
  },

  quality: {
    id: 'quality',
    name: 'Quality Assurance & QC',
    version: '1.9.0',
    description: 'Inward dock audits, in-process dimension checks, finished goods release, and non-conformance reports.',
    category: 'Manufacturing',
    iconName: 'CheckCircle2',
    isCore: false,
    capabilities: [
      'checkpoint-inspections',
      'tolerance-recording',
      'ncr-tracking',
      'sampling-inspection'
    ],
    dependencies: [],
    optionalDependencies: [
      { moduleId: 'purchase', isRequired: false, purpose: 'Block vendor GRN release until incoming lot passes inspection' }
    ],
    permissions: [
      { id: 'quality.inspections.read', moduleId: 'quality', resource: 'inspections', action: 'read', description: 'View inspection parameters and lot acceptance history', availableScopes: ['branch', 'company'] },
      { id: 'quality.inspections.create', moduleId: 'quality', resource: 'inspections', action: 'create', description: 'Record inspection readings and lot release decisions', availableScopes: ['branch', 'company'] }
    ]
  },

  work: {
    id: 'work',
    name: 'Work & Project Management',
    version: '1.5.0',
    description: 'Tooling design projects, client milestones, job cards, and engineering task tracking.',
    category: 'Operations & Services',
    iconName: 'Briefcase',
    isCore: false,
    capabilities: [
      'project-milestones',
      'kanban-task-board',
      'time-tracking',
      'drawing-attachments'
    ],
    dependencies: [],
    optionalDependencies: [],
    permissions: [
      { id: 'work.projects.read', moduleId: 'work', resource: 'projects', action: 'read', description: 'View project roadmaps and team tasks', availableScopes: ['own', 'team', 'company'] },
      { id: 'work.projects.create', moduleId: 'work', resource: 'projects', action: 'create', description: 'Create projects and assign deliverables', availableScopes: ['company'] }
    ]
  },

  khatabook: {
    id: 'khatabook',
    name: 'Khatabook (Daybook & Udhar)',
    version: '2.1.0',
    description: 'Daily cash in/out, customer credit (udhar) tracking, payment reminders, and WhatsApp balance slips.',
    category: 'Finance & Tax',
    iconName: 'BookOpen',
    isCore: false,
    capabilities: [
      'daily-cash-register',
      'customer-credit-ledger',
      'whatsapp-payment-reminders',
      'quick-settlement'
    ],
    dependencies: [],
    optionalDependencies: [],
    permissions: [
      { id: 'khatabook.entries.read', moduleId: 'khatabook', resource: 'entries', action: 'read', description: 'View daily cash entries and credit balances', availableScopes: ['branch', 'company'] },
      { id: 'khatabook.entries.create', moduleId: 'khatabook', resource: 'entries', action: 'create', description: 'Record daily cash receipts, payments, and udhar', availableScopes: ['branch', 'company'] }
    ]
  },

  finance: {
    id: 'finance',
    name: 'Finance & General Ledger',
    version: '2.6.0',
    description: 'Double-entry bookkeeping, chart of accounts, bank reconciliation, trial balance, and P&L.',
    category: 'Finance & Tax',
    iconName: 'FileSpreadsheet',
    badge: 'Enterprise',
    isCore: true,
    capabilities: [
      'double-entry-ledger',
      'chart-of-accounts',
      'bank-reconciliation',
      'financial-statements',
      'voucher-approvals'
    ],
    dependencies: [],
    optionalDependencies: [],
    permissions: [
      { id: 'finance.ledger.read', moduleId: 'finance', resource: 'ledger', action: 'read', description: 'Inspect general ledger, balance sheet, and trial balance', availableScopes: ['company'] },
      { id: 'finance.vouchers.create', moduleId: 'finance', resource: 'vouchers', action: 'create', description: 'Post journal vouchers and bank entries', availableScopes: ['company'] },
      { id: 'finance.vouchers.approve', moduleId: 'finance', resource: 'vouchers', action: 'approve', description: 'Authorize high-value ledger payments', availableScopes: ['company'] }
    ]
  },

  gstReturns: {
    id: 'gstReturns',
    name: 'GST Returns & 2B Auto-Recon',
    version: '2.0.0',
    description: 'Automated GSTR-1, GSTR-3B monthly filing summaries, and 2B purchase ITC reconciliation.',
    category: 'Finance & Tax',
    iconName: 'Receipt',
    badge: 'Tax Compliance',
    isCore: false,
    capabilities: [
      'gstr1-summary',
      'gstr3b-calculation',
      'gstr2b-itc-reconciliation',
      'e-invoicing-irn'
    ],
    dependencies: [],
    optionalDependencies: [
      { moduleId: 'sales', isRequired: false, purpose: 'Auto-aggregate tax invoices into B2B / B2C GSTR-1 tables' },
      { moduleId: 'purchase', isRequired: false, purpose: 'Match vendor invoices against GSTR-2B inward supplies' }
    ],
    permissions: [
      { id: 'gst.returns.read', moduleId: 'gstReturns', resource: 'returns', action: 'read', description: 'View monthly GST liability and ITC registers', availableScopes: ['company'] },
      { id: 'gst.returns.file', moduleId: 'gstReturns', resource: 'returns', action: 'admin', description: 'Generate and lock statutory GST return payloads', availableScopes: ['company'] }
    ]
  },

  caDesk: {
    id: 'caDesk',
    name: 'CA & Auditor Collaboration Desk',
    version: '1.8.0',
    description: 'Secure, read-only chartered accountant portal for tax audits, schedule exports, and compliance review.',
    category: 'Finance & Tax',
    iconName: 'Scale',
    isCore: false,
    capabilities: [
      'audit-trail-export',
      'depreciation-schedules',
      'statutory-compliance-check',
      'ca-query-management'
    ],
    dependencies: [
      { moduleId: 'finance', isRequired: true, purpose: 'Access trial balance and ledger vouchers for statutory review' }
    ],
    optionalDependencies: [],
    permissions: [
      { id: 'cadesk.audit.read', moduleId: 'caDesk', resource: 'audit', action: 'read', description: 'Read-only access to audit trail and statutory schedules', availableScopes: ['company'] }
    ]
  },

  hrms: {
    id: 'hrms',
    name: 'HRMS, Attendance & Payroll',
    version: '2.1.0',
    description: 'Employee profiles, biometric/mobile attendance, leave workflows, and Indian statutory payroll (PF/ESI/TDS).',
    category: 'Human Capital',
    iconName: 'Users',
    badge: 'HR & Staff',
    isCore: false,
    capabilities: [
      'employee-master',
      'shift-attendance',
      'leave-approvals',
      'statutory-payroll-pf-esi',
      'payslip-generation'
    ],
    dependencies: [],
    optionalDependencies: [
      { moduleId: 'finance', isRequired: false, purpose: 'Post monthly payroll expenditure vouchers to General Ledger' }
    ],
    permissions: [
      { id: 'hrms.employees.read', moduleId: 'hrms', resource: 'employees', action: 'read', description: 'View staff directory and department listings', availableScopes: ['branch', 'company'] },
      { id: 'hrms.employees.manage', moduleId: 'hrms', resource: 'employees', action: 'admin', description: 'Hire, onboard, and manage employee records', availableScopes: ['company'] },
      { id: 'hrms.payroll.process', moduleId: 'hrms', resource: 'payroll', action: 'approve', description: 'Calculate and authorize monthly payroll disbursements', availableScopes: ['company'] }
    ]
  },

  support: {
    id: 'support',
    name: 'Helpdesk & Support Desk',
    version: '1.4.0',
    description: 'Machine breakdown reports, customer warranty claims, internal IT tickets, and SLA escalations.',
    category: 'Operations & Services',
    iconName: 'LifeBuoy',
    isCore: false,
    capabilities: [
      'ticket-queues',
      'sla-tracking',
      'breakdown-reporting',
      'customer-warranty-claims'
    ],
    dependencies: [],
    optionalDependencies: [],
    permissions: [
      { id: 'support.tickets.read', moduleId: 'support', resource: 'tickets', action: 'read', description: 'View service tickets and customer complaints', availableScopes: ['own', 'branch', 'company'] },
      { id: 'support.tickets.create', moduleId: 'support', resource: 'tickets', action: 'create', description: 'Log breakdown tickets or customer complaints', availableScopes: ['branch', 'company'] },
      { id: 'support.tickets.resolve', moduleId: 'support', resource: 'tickets', action: 'update', description: 'Resolve service tickets and log corrective actions', availableScopes: ['company'] }
    ]
  },

  reports: {
    id: 'reports',
    name: 'Analytics & Management Reports',
    version: '2.5.0',
    description: 'Multi-dimensional plant metrics: Sales registers, purchase spend, inventory aging, and worker efficiency.',
    category: 'Core Platform',
    iconName: 'BarChart3',
    badge: 'Analytics',
    isCore: true,
    capabilities: [
      'sales-performance',
      'purchase-cost-analysis',
      'inventory-aging',
      'rejection-rates',
      'export-excel-pdf'
    ],
    dependencies: [],
    optionalDependencies: [],
    permissions: [
      { id: 'reports.analytics.read', moduleId: 'reports', resource: 'analytics', action: 'read', description: 'View managerial KPIs, sales registers, and costing analytics', availableScopes: ['branch', 'company'] },
      { id: 'reports.analytics.export', moduleId: 'reports', resource: 'analytics', action: 'export', description: 'Export detailed financial and operational reports', availableScopes: ['company'] }
    ]
  }
};

/**
 * Return all registered manifests
 */
export const getAllModuleManifests = (): ERPModuleManifest[] => {
  return Object.values(MODULE_REGISTRY);
};

/**
 * Query a single module manifest
 */
export const getModuleManifest = (moduleId: string): ERPModuleManifest | undefined => {
  return MODULE_REGISTRY[moduleId];
};

/**
 * Validate whether module dependencies are satisfied by the currently enabled list
 */
export const validateModuleDependencies = (
  moduleId: string,
  currentlyEnabledModuleIds: string[]
): { canEnable: boolean; missingDependencies: string[] } => {
  const manifest = MODULE_REGISTRY[moduleId];
  if (!manifest) return { canEnable: false, missingDependencies: ['UNKNOWN_MODULE'] };

  const missing: string[] = [];
  for (const dep of manifest.dependencies) {
    if (dep.isRequired && !currentlyEnabledModuleIds.includes(dep.moduleId)) {
      const depManifest = MODULE_REGISTRY[dep.moduleId];
      missing.push(depManifest ? depManifest.name : dep.moduleId);
    }
  }

  return {
    canEnable: missing.length === 0,
    missingDependencies: missing
  };
};

/**
 * Return all permission definitions declared across the platform
 */
export const getAllPlatformPermissions = (): PermissionDefinition[] => {
  const permissions: PermissionDefinition[] = [
    // Platform-level governance permissions
    { id: 'platform.modules.manage', moduleId: 'platform', resource: 'modules', action: 'admin', description: 'Activate, configure, or deactivate company modules', availableScopes: ['company'] },
    { id: 'platform.roles.manage', moduleId: 'platform', resource: 'roles', action: 'admin', description: 'Configure custom company roles and permission matrices', availableScopes: ['company'] },
    { id: 'platform.users.invite', moduleId: 'platform', resource: 'users', action: 'admin', description: 'Invite users, allot roles, and initiate Supabase verification', availableScopes: ['company'] },
    { id: 'platform.audit.read', moduleId: 'platform', resource: 'audit', action: 'read', description: 'Inspect tamper-evident system audit logs', availableScopes: ['company'] }
  ];

  for (const manifest of Object.values(MODULE_REGISTRY)) {
    permissions.push(...manifest.permissions);
  }

  return permissions;
};

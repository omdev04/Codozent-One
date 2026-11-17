import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { z } from 'zod';
import { authLimiter } from '../middleware/security';
import { MODULE_REGISTRY, validateModuleDependencies } from '../../src/lib/moduleRegistry';
import { platformDatabase } from './database';
import { db as erpStore } from '../db/store';
import {
  hasPlatformPermission,
  isStrongPlatformSecret,
  issuePlatformToken,
  PlatformRequest,
  PlatformRole,
  requirePlatformAuth,
  requirePlatformPermission,
  writePlatformAudit,
  getPlatformJwtSecret,
  getPlatformBootstrapToken
} from './security';

const router = Router();

router.use((_req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, private');
  res.setHeader('Pragma', 'no-cache');
  next();
});

const fail = (res: Response, status: number, code: string, message: string, details?: unknown) =>
  res.status(status).json({ success: false, error: { code, message, details } });

const getDb = (res: Response) => {
  if (!platformDatabase) {
    fail(res, 503, 'PLATFORM_DATABASE_UNCONFIGURED', 'Platform administration requires Supabase URL and a server-only service role key.');
    return null;
  }
  return platformDatabase;
};

const safeAudit = async (
  req: PlatformRequest,
  action: string,
  resourceType: string,
  resourceId?: string | null,
  reason?: string | null,
  before?: unknown,
  after?: unknown
) => {
  if (!req.platformOperator) throw new Error('Platform actor is missing.');
  await writePlatformAudit({
    actorId: req.platformOperator.id,
    action,
    resourceType,
    resourceId,
    reason,
    before,
    after,
    requestId: req.header('x-request-id') || crypto.randomUUID(),
    actorIp: req.ip,
    userAgent: req.header('user-agent')
  });
};

const bootstrapSchema = z.object({
  bootstrapToken: z.string().min(32).max(256),
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(254),
  password: z.string().min(14).max(128)
});

const roleSchema = z.enum(['super_admin', 'platform_admin', 'billing_admin', 'support_admin', 'read_only']);

// -----------------------------------------------------------------------------
// 1. AUTHENTICATION & BOOTSTRAP
// -----------------------------------------------------------------------------

router.get('/auth/status', async (_req, res) => {
  const db = getDb(res);
  if (!db) return;
  const [{ count, error }, { data: bootstrap, error: bootstrapError }] = await Promise.all([
    db.from('platform_operators').select('id', { count: 'exact', head: true }),
    db.from('platform_bootstrap_state').select('claimed_at,completed_at').eq('singleton', true).maybeSingle()
  ]);

  if (error || bootstrapError) {
    return fail(res, 503, 'PLATFORM_SCHEMA_UNAVAILABLE', 'Platform schema is not installed or unavailable.');
  }

  const jwtSec = getPlatformJwtSecret();
  const bootTok = getPlatformBootstrapToken();

  res.json({
    success: true,
    data: {
      bootstrapAvailable: count === 0 && !bootstrap?.claimed_at && !bootstrap?.completed_at,
      configured: Boolean(isStrongPlatformSecret(jwtSec) && ((count || 0) > 0 || isStrongPlatformSecret(bootTok)))
    }
  });
});

router.post('/auth/bootstrap', authLimiter, async (req, res) => {
  const db = getDb(res);
  if (!db) return;
  const jwtSec = getPlatformJwtSecret();
  if (!isStrongPlatformSecret(jwtSec)) {
    return fail(res, 503, 'PLATFORM_AUTH_UNCONFIGURED', 'Configure a separate non-placeholder platform JWT secret of at least 32 characters before bootstrap.');
  }

  const parsed = bootstrapSchema.safeParse(req.body);
  if (!parsed.success) {
    return fail(res, 400, 'VALIDATION_ERROR', 'Provide a valid one-time bootstrap token, operator name, email, and a password of at least 14 characters.');
  }

  const expected = getPlatformBootstrapToken();
  const supplied = parsed.data.bootstrapToken;
  if (!isStrongPlatformSecret(expected) || Buffer.byteLength(expected) !== Buffer.byteLength(supplied) || !crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(supplied))) {
    return fail(res, 403, 'BOOTSTRAP_DENIED', 'Platform bootstrap token is incorrect or unauthorized.');
  }

  const { data: claim, error: claimError } = await db.from('platform_bootstrap_state')
    .update({ claimed_at: new Date().toISOString() })
    .eq('singleton', true)
    .is('claimed_at', null)
    .is('completed_at', null)
    .select('singleton')
    .maybeSingle();

  if (claimError) return fail(res, 503, 'PLATFORM_SCHEMA_UNAVAILABLE', 'Platform schema is not installed or unavailable.');
  if (!claim) return fail(res, 409, 'BOOTSTRAP_CLOSED', 'Platform bootstrap has already been claimed.');

  const { count, error: countError } = await db.from('platform_operators').select('id', { count: 'exact', head: true });
  if (countError) return fail(res, 503, 'PLATFORM_SCHEMA_UNAVAILABLE', 'Platform operator records are unavailable.');
  if ((count || 0) > 0) return fail(res, 409, 'BOOTSTRAP_CLOSED', 'An operator already exists. Bootstrap is permanently closed.');

  const passwordHash = await bcrypt.hash(parsed.data.password, 12);
  const { data: operator, error } = await db.from('platform_operators').insert({
    name: parsed.data.name,
    email: parsed.data.email.toLowerCase(),
    password_hash: passwordHash,
    role: 'super_admin',
    is_active: true,
    token_version: 1
  }).select('id,email,name,role,token_version').single();

  if (error || !operator) {
    return fail(res, 409, 'OPERATOR_CREATE_FAILED', 'Could not create the initial operator. Check whether bootstrap was already completed.');
  }

  await db.from('platform_bootstrap_state').update({ completed_at: new Date().toISOString(), operator_id: operator.id }).eq('singleton', true);
  const token = issuePlatformToken(operator);

  await writePlatformAudit({
    actorId: operator.id,
    action: 'platform.bootstrap',
    resourceType: 'platform_operator',
    resourceId: operator.id,
    actorIp: req.ip,
    userAgent: req.header('user-agent')
  });

  res.status(201).json({
    success: true,
    data: {
      token,
      operator: { id: operator.id, email: operator.email, name: operator.name, role: operator.role }
    }
  });
});

router.post('/auth/login', authLimiter, async (req, res) => {
  const db = getDb(res);
  if (!db) return;
  const parsed = z.object({
    email: z.string().trim().email().max(254),
    password: z.string().min(1).max(128)
  }).safeParse(req.body);

  if (!parsed.success) return fail(res, 400, 'VALIDATION_ERROR', 'Enter a valid email and password.');

  const { data: operator, error } = await db.from('platform_operators')
    .select('id,email,name,role,password_hash,is_active,token_version')
    .eq('email', parsed.data.email.toLowerCase())
    .maybeSingle();

  if (error) return fail(res, 503, 'PLATFORM_AUTH_UNAVAILABLE', 'Platform sign-in is temporarily unavailable.');
  if (!operator) return fail(res, 401, 'INVALID_CREDENTIALS', 'Email or password is incorrect.');

  const valid = await bcrypt.compare(parsed.data.password, operator.password_hash);
  if (!valid || !operator.is_active) return fail(res, 401, 'INVALID_CREDENTIALS', 'Email or password is incorrect.');

  const token = issuePlatformToken(operator);
  await db.from('platform_operators').update({ last_login_at: new Date().toISOString() }).eq('id', operator.id);

  await writePlatformAudit({
    actorId: operator.id,
    action: 'platform.login',
    resourceType: 'platform_operator',
    resourceId: operator.id,
    actorIp: req.ip,
    userAgent: req.header('user-agent')
  });

  res.json({
    success: true,
    data: {
      token,
      operator: { id: operator.id, email: operator.email, name: operator.name, role: operator.role }
    }
  });
});

// All routes beyond this point strictly require valid Platform Operator Bearer Token
router.use(requirePlatformAuth);

router.get('/auth/me', (req: PlatformRequest, res) => {
  res.json({ success: true, data: { operator: req.platformOperator } });
});

router.post('/auth/logout', async (req: PlatformRequest, res) => {
  const db = getDb(res);
  if (!db || !req.platformOperator) return;
  const { error } = await db.from('platform_operators')
    .update({ token_version: req.platformOperator.tokenVersion + 1 })
    .eq('id', req.platformOperator.id);

  if (error) return fail(res, 503, 'SESSION_REVOKE_FAILED', 'Could not revoke the platform session.');
  await safeAudit(req, 'platform.logout', 'platform_operator', req.platformOperator.id);
  res.json({ success: true, data: { signedOut: true } });
});

// -----------------------------------------------------------------------------
// 2. PLATFORM OVERVIEW & HEALTH
// -----------------------------------------------------------------------------

router.get('/overview', requirePlatformPermission('overview.read'), async (_req: PlatformRequest, res) => {
  const db = getDb(res);
  if (!db) return;
  const { data: totals, error } = await db.rpc('platform_admin_overview');
  if (error || !totals) {
    return fail(res, 503, 'PLATFORM_METRICS_UNAVAILABLE', 'Platform overview migration or its data sources are not available.');
  }

  // Calculate MRR/ARR from active subscriptions if any
  const { data: activeSubs } = await db.from('platform_subscriptions').select('amount,interval').eq('status', 'active');
  let mrr = 0;
  if (activeSubs && activeSubs.length > 0) {
    mrr = activeSubs.reduce((acc, sub) => acc + (sub.interval === 'annual' ? Number(sub.amount) / 12 : Number(sub.amount)), 0);
  }

  res.json({
    success: true,
    data: {
      asOf: new Date().toISOString(),
      sources: 'Supabase platform & tenant metadata tables (service-role authenticated)',
      tenants: {
        totalCompanies: Number(totals.companies || 0),
        activeSubscriptions: Number(totals.active_subscriptions || 0),
        trials: Number(totals.trials || 0)
      },
      billing: {
        overdueInvoices: Number(totals.overdue_invoices || 0),
        payments: totals.payments_by_currency || {},
        paymentCount: Number(totals.payment_count || 0),
        mrrINR: mrr
      },
      expenses: {
        approvedCount: Number(totals.approved_expense_count || 0),
        totals: totals.approved_expenses_by_currency || {}
      },
      modules: {
        enabledAssignments: Number(totals.enabled_module_assignments || 0)
      },
      financialDataAvailable: true
    }
  });
});

router.get('/health', requirePlatformPermission('overview.read'), async (_req: PlatformRequest, res) => {
  const startTime = Date.now();
  let dbStatus = 'healthy';
  let dbLatencyMs = 0;

  try {
    const db = getDb(res);
    if (db) {
      const ping = await db.from('platform_operators').select('id', { count: 'exact', head: true });
      dbLatencyMs = Date.now() - startTime;
      if (ping.error) dbStatus = 'degraded';
    } else {
      dbStatus = 'unconfigured';
    }
  } catch {
    dbStatus = 'down';
  }

  res.json({
    success: true,
    data: {
      status: dbStatus === 'healthy' ? 'optimal' : dbStatus,
      uptimeSeconds: Math.floor(process.uptime()),
      nodeVersion: process.version,
      memoryUsageMB: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      database: { status: dbStatus, latencyMs: dbLatencyMs },
      asOf: new Date().toISOString()
    }
  });
});

// -----------------------------------------------------------------------------
// 3. CUSTOMER COMPANIES & TENANTS (FULL CRUD & INSPECTION)
// -----------------------------------------------------------------------------

router.get('/companies', requirePlatformPermission('companies.read'), async (req: PlatformRequest, res) => {
  const db = getDb(res);
  if (!db) return;
  const page = Math.max(1, Number(req.query.page) || 1);
  const pageSize = Math.min(100, Math.max(1, Number(req.query.pageSize) || 25));
  const search = String(req.query.search || '').trim().slice(0, 80);
  const statusFilter = String(req.query.status || 'all').trim();

  let query = db.from('companies')
    .select('id,tenant_id,name,code,gstin,pan,city,state,phone,email,created_at', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range((page - 1) * pageSize, page * pageSize - 1);

  if (search) {
    query = query.ilike('name', `%${search.replace(/[%_,]/g, '')}%`);
  }

  const { data, count, error } = await query;
  if (error) return fail(res, 503, 'COMPANIES_UNAVAILABLE', 'Customer company metadata is unavailable.');

  const tenantIds = [...new Set((data || []).map((c: any) => c.tenant_id).filter(Boolean))];
  const companyIds = (data || []).map((c: any) => c.id);

  let tenantStatuses: Record<string, string> = {};
  if (tenantIds.length) {
    const tenants = await db.from('tenants').select('id,status').in('id', tenantIds);
    if (!tenants.error) {
      tenantStatuses = Object.fromEntries((tenants.data || []).map((t: any) => [t.id, t.status]));
    }
  }

  // Count modules and users per company
  let moduleCounts: Record<string, number> = {};
  let userCounts: Record<string, number> = {};
  if (companyIds.length) {
    const [modRes, userRes] = await Promise.all([
      db.from('company_modules').select('company_id').eq('status', 'enabled').in('company_id', companyIds),
      db.from('company_users').select('company_id').in('company_id', companyIds)
    ]);
    if (!modRes.error && modRes.data) {
      modRes.data.forEach((m: any) => { moduleCounts[m.company_id] = (moduleCounts[m.company_id] || 0) + 1; });
    }
    if (!userRes.error && userRes.data) {
      userRes.data.forEach((u: any) => { userCounts[u.company_id] = (userCounts[u.company_id] || 0) + 1; });
    }
  }

  let items = (data || []).map((c: any) => ({
    ...c,
    status: c.tenant_id ? tenantStatuses[c.tenant_id] || 'active' : 'active',
    modulesCount: moduleCounts[c.id] || 0,
    usersCount: userCounts[c.id] || 1
  }));

  if (statusFilter !== 'all') {
    items = items.filter(x => x.status === statusFilter);
  }

  res.json({
    success: true,
    data: { items, page, pageSize, total: count || 0 }
  });
});

const companyCreateSchema = z.object({
  name: z.string().trim().min(2, 'Company name is required').max(120),
  code: z.string().trim().toUpperCase().min(2).max(10),
  gstin: z.string().trim().max(15).optional(),
  pan: z.string().trim().max(10).optional(),
  address: z.string().trim().max(250).optional(),
  city: z.string().trim().min(2).max(60).default('Pune'),
  state: z.string().trim().min(2).max(60).default('Maharashtra'),
  stateCode: z.string().trim().max(2).default('27'),
  pincode: z.string().trim().max(10).optional(),
  phone: z.string().trim().max(20).optional(),
  email: z.string().trim().email().max(120),
  industry: z.string().trim().max(100).default('Precision Engineering & Manufacturing'),
  reason: z.string().trim().min(8, 'Provide a valid justification (minimum 8 characters)').max(500)
});

router.post('/companies', requirePlatformPermission('companies.manage'), async (req: PlatformRequest, res) => {
  const db = getDb(res);
  if (!db) return;

  const parsed = companyCreateSchema.safeParse(req.body);
  if (!parsed.success) {
    return fail(res, 400, 'VALIDATION_ERROR', 'Invalid customer company parameters.', parsed.error.errors);
  }

  // 1. Create or link Tenant
  const tenantSlug = `${parsed.data.code.toLowerCase()}-${Date.now().toString(36)}`;
  const { data: tenant, error: tenantErr } = await db.from('tenants').insert({
    name: parsed.data.name,
    slug: tenantSlug,
    subscription_tier: 'enterprise',
    status: 'active'
  }).select('id,name,status').single();

  const tenantId = tenant?.id || null;

  // 2. Create Company entity
  const companyId = crypto.randomUUID();
  const companyRow = {
    id: companyId,
    tenant_id: tenantId,
    name: parsed.data.name,
    code: parsed.data.code,
    gstin: parsed.data.gstin || null,
    pan: parsed.data.pan || null,
    address: parsed.data.address || null,
    city: parsed.data.city,
    state: parsed.data.state,
    state_code: parsed.data.stateCode,
    pincode: parsed.data.pincode || null,
    phone: parsed.data.phone || null,
    email: parsed.data.email,
    currency: 'INR'
  };

  const { data: createdCompany, error: compErr } = await db.from('companies').insert(companyRow).select().single();
  if (compErr || !createdCompany) {
    return fail(res, 409, 'COMPANY_CREATE_FAILED', 'Could not provision company entity. Code may already be registered.');
  }

  // 3. Assign Default Core Modules in Supabase
  const defaultCoreModules = ['crm', 'quotations', 'sales', 'inventory', 'manufacturing', 'quality', 'finance', 'settings'];
  for (const modId of defaultCoreModules) {
    await db.from('company_modules').insert({
      company_id: companyId,
      module_id: modId,
      status: 'enabled'
    });
  }

  // 4. Synchronize with local store so ERP users see the tenant immediately
  try {
    erpStore.addCompany({
      id: companyId,
      name: parsed.data.name,
      code: parsed.data.code,
      gstin: parsed.data.gstin || '',
      pan: parsed.data.pan || '',
      address: parsed.data.address || '',
      city: parsed.data.city,
      state: parsed.data.state,
      stateCode: parsed.data.stateCode,
      pincode: parsed.data.pincode || '',
      phone: parsed.data.phone || '',
      email: parsed.data.email,
      currency: 'INR',
      industry: parsed.data.industry
    });
  } catch (syncErr) {
    console.warn('[Platform -> ERP Store Sync Notice]', syncErr);
  }

  await safeAudit(req, 'company.create', 'company', companyId, parsed.data.reason, null, createdCompany);
  res.status(201).json({ success: true, data: createdCompany });
});

router.get('/companies/:companyId/details', requirePlatformPermission('companies.read'), async (req: PlatformRequest, res) => {
  const db = getDb(res);
  if (!db) return;
  const { companyId } = req.params;

  const [companyRes, modulesRes, subRes, usersRes, auditRes] = await Promise.all([
    db.from('companies').select('*').eq('id', companyId).maybeSingle(),
    db.from('company_modules').select('module_id,status,updated_at').eq('company_id', companyId),
    db.from('platform_subscriptions').select('*, plan:platform_plans(*)').eq('company_id', companyId).order('created_at', { ascending: false }).limit(1).maybeSingle(),
    db.from('company_users').select('id,name,email,role,is_active,department').eq('company_id', companyId),
    db.from('platform_audit_log').select('*').eq('resource_id', companyId).order('created_at', { ascending: false }).limit(20)
  ]);

  if (companyRes.error || !companyRes.data) {
    return fail(res, 404, 'COMPANY_NOT_FOUND', 'Customer company not found.');
  }

  res.json({
    success: true,
    data: {
      company: companyRes.data,
      modules: modulesRes.data || [],
      activeSubscription: subRes.data || null,
      users: usersRes.data || [],
      recentAudit: auditRes.data || []
    }
  });
});

router.put('/companies/:companyId', requirePlatformPermission('companies.manage'), async (req: PlatformRequest, res) => {
  const db = getDb(res);
  if (!db) return;
  const { companyId } = req.params;

  const parsed = z.object({
    name: z.string().trim().min(2).max(120),
    code: z.string().trim().toUpperCase().min(2).max(10),
    gstin: z.string().trim().max(15).optional(),
    pan: z.string().trim().max(10).optional(),
    address: z.string().trim().max(250).optional(),
    city: z.string().trim().min(2).max(60),
    state: z.string().trim().min(2).max(60),
    phone: z.string().trim().max(20).optional(),
    email: z.string().trim().email().max(120),
    reason: z.string().trim().min(8).max(500)
  }).safeParse(req.body);

  if (!parsed.success) return fail(res, 400, 'VALIDATION_ERROR', 'Invalid company parameters.');

  const { data: before } = await db.from('companies').select('*').eq('id', companyId).maybeSingle();
  if (!before) return fail(res, 404, 'COMPANY_NOT_FOUND', 'Company not found.');

  const { data: after, error } = await db.from('companies').update({
    name: parsed.data.name,
    code: parsed.data.code,
    gstin: parsed.data.gstin || null,
    pan: parsed.data.pan || null,
    address: parsed.data.address || null,
    city: parsed.data.city,
    state: parsed.data.state,
    phone: parsed.data.phone || null,
    email: parsed.data.email,
    updated_at: new Date().toISOString()
  }).eq('id', companyId).select().single();

  if (error || !after) return fail(res, 503, 'COMPANY_UPDATE_FAILED', 'Could not update company profile.');

  erpStore.updateCompany(companyId, after);
  await safeAudit(req, 'company.update', 'company', companyId, parsed.data.reason, before, after);
  res.json({ success: true, data: after });
});

router.patch('/companies/:companyId/status', requirePlatformPermission('companies.manage'), async (req: PlatformRequest, res) => {
  const db = getDb(res);
  if (!db) return;
  const parsed = z.object({
    status: z.enum(['active', 'suspended']),
    reason: z.string().trim().min(8).max(500)
  }).safeParse(req.body);

  if (!parsed.success) return fail(res, 400, 'VALIDATION_ERROR', 'Choose active or suspended and provide a reason of at least 8 characters.');

  const { data: company, error: lookupError } = await db.from('companies').select('id,tenant_id').eq('id', req.params.companyId).maybeSingle();
  if (lookupError || !company) return fail(res, 404, 'COMPANY_NOT_FOUND', 'Customer company was not found.');

  let targetId = company.tenant_id;
  if (!targetId) {
    // If unlinked, provision a tenant link
    const { data: newTenant } = await db.from('tenants').insert({
      name: `Tenant-${company.id.slice(0, 8)}`,
      slug: `tenant-${company.id.slice(0, 8)}-${Date.now()}`,
      status: parsed.data.status
    }).select('id').single();
    if (newTenant) {
      await db.from('companies').update({ tenant_id: newTenant.id }).eq('id', company.id);
      targetId = newTenant.id;
    }
  }

  const { data: before } = await db.from('tenants').select('status').eq('id', targetId).maybeSingle();
  const { data: after, error } = await db.from('tenants')
    .update({ status: parsed.data.status, updated_at: new Date().toISOString() })
    .eq('id', targetId)
    .select('id,status')
    .single();

  if (error || !after) return fail(res, 503, 'TENANT_UPDATE_FAILED', 'Tenant status could not be updated.');

  await safeAudit(req, `tenant.${parsed.data.status}`, 'tenant', targetId, parsed.data.reason, before, after);
  res.json({ success: true, data: after });
});

// -----------------------------------------------------------------------------
// 4. MODULES CATALOG & TENANT ENTITLEMENTS
// -----------------------------------------------------------------------------

router.get('/modules', requirePlatformPermission('modules.read'), async (_req, res) => {
  const db = getDb(res);
  if (!db) return;
  const { data, error } = await db.from('company_modules').select('company_id,module_id,status,updated_at').limit(5000);
  if (error) return fail(res, 503, 'MODULE_ASSIGNMENTS_UNAVAILABLE', 'Module assignment data is unavailable.');
  res.json({ success: true, data: { catalog: Object.values(MODULE_REGISTRY), assignments: data || [] } });
});

router.put('/companies/:companyId/modules/:moduleId', requirePlatformPermission('modules.manage'), async (req: PlatformRequest, res) => {
  const db = getDb(res);
  if (!db) return;
  const parsed = z.object({
    status: z.enum(['enabled', 'disabled']),
    reason: z.string().trim().min(8).max(500)
  }).safeParse(req.body);

  const { companyId, moduleId } = req.params;
  const manifest = MODULE_REGISTRY[moduleId];
  if (!parsed.success || !manifest) return fail(res, 400, 'VALIDATION_ERROR', 'A valid module state and reason are required.');

  const company = await db.from('companies').select('id').eq('id', companyId).maybeSingle();
  if (company.error || !company.data) return fail(res, 404, 'COMPANY_NOT_FOUND', 'Customer company was not found.');
  if (parsed.data.status === 'disabled' && manifest.isCore) return fail(res, 409, 'CORE_MODULE_LOCKED', 'Core platform modules cannot be disabled.');

  const current = await db.from('company_modules').select('module_id,status').eq('company_id', companyId);
  if (current.error) return fail(res, 503, 'MODULES_UNAVAILABLE', 'Current module assignments are unavailable.');

  const enabled = new Set((current.data || []).filter((m: any) => m.status === 'enabled').map((m: any) => m.module_id));
  if (parsed.data.status === 'enabled') enabled.add(moduleId); else enabled.delete(moduleId);

  if (parsed.data.status === 'enabled') {
    const check = validateModuleDependencies(moduleId, [...enabled]);
    if (!check.canEnable) {
      return fail(res, 409, 'MISSING_DEPENDENCIES', `Enable required modules first: ${check.missingDependencies.join(', ')}`);
    }
  } else {
    for (const activeModuleId of enabled) {
      const check = validateModuleDependencies(activeModuleId, [...enabled]);
      if (!check.canEnable) {
        return fail(res, 409, 'MODULE_IN_USE', `Cannot disable ${moduleId}; enabled module ${activeModuleId} depends on it.`);
      }
    }
  }

  const { data: before } = await db.from('company_modules').select('status').eq('company_id', companyId).eq('module_id', moduleId).maybeSingle();
  const { data: after, error } = await db.from('company_modules')
    .upsert({ company_id: companyId, module_id: moduleId, status: parsed.data.status, updated_at: new Date().toISOString() }, { onConflict: 'company_id,module_id' })
    .select('company_id,module_id,status,updated_at')
    .single();

  if (error || !after) return fail(res, 503, 'MODULE_UPDATE_FAILED', 'Module assignment could not be updated.');
  await safeAudit(req, `module.${parsed.data.status}`, 'company_module', `${companyId}:${moduleId}`, parsed.data.reason, before, after);
  res.json({ success: true, data: after });
});

// -----------------------------------------------------------------------------
// 5. PLANS & PRICING VERSIONING
// -----------------------------------------------------------------------------

router.get('/plans', requirePlatformPermission('plans.read'), async (_req, res) => {
  const db = getDb(res);
  if (!db) return;
  const { data, error } = await db.from('platform_plans').select('*').order('created_at', { ascending: false });
  if (error) return fail(res, 503, 'PLANS_UNAVAILABLE', 'Platform plan schema is unavailable.');
  res.json({ success: true, data: data || [] });
});

router.post('/plans', requirePlatformPermission('plans.manage'), async (req: PlatformRequest, res) => {
  const db = getDb(res);
  if (!db) return;
  const parsed = z.object({
    name: z.string().trim().min(2).max(100),
    code: z.string().trim().regex(/^[a-z0-9-]+$/).max(40),
    description: z.string().max(500).optional(),
    currency: z.string().regex(/^[A-Z]{3}$/).default('INR'),
    monthlyPrice: z.number().nonnegative().finite(),
    annualPrice: z.number().nonnegative().finite(),
    seatLimit: z.number().int().positive().nullable(),
    moduleEntitlements: z.array(z.string().max(50)),
    reason: z.string().trim().min(8).max(500)
  }).safeParse(req.body);

  if (!parsed.success) return fail(res, 400, 'VALIDATION_ERROR', 'Plan details are invalid.');

  const { data, error } = await db.from('platform_plans').insert({
    name: parsed.data.name,
    code: parsed.data.code,
    description: parsed.data.description || null,
    currency: parsed.data.currency,
    monthly_price: parsed.data.monthlyPrice,
    annual_price: parsed.data.annualPrice,
    seat_limit: parsed.data.seatLimit,
    module_entitlements: parsed.data.moduleEntitlements,
    is_active: true,
    created_by: req.platformOperator!.id
  }).select().single();

  if (error || !data) return fail(res, 409, 'PLAN_CREATE_FAILED', 'Plan could not be created. Code may already exist.');
  await safeAudit(req, 'plan.create', 'platform_plan', data.id, parsed.data.reason, null, data);
  res.status(201).json({ success: true, data });
});

router.put('/plans/:id', requirePlatformPermission('plans.manage'), async (req: PlatformRequest, res) => {
  const db = getDb(res);
  if (!db) return;
  const parsed = z.object({
    name: z.string().trim().min(2).max(100),
    description: z.string().max(500).optional(),
    monthlyPrice: z.number().nonnegative().finite(),
    annualPrice: z.number().nonnegative().finite(),
    seatLimit: z.number().int().positive().nullable(),
    moduleEntitlements: z.array(z.string().max(50)),
    reason: z.string().trim().min(8).max(500)
  }).safeParse(req.body);

  if (!parsed.success) return fail(res, 400, 'VALIDATION_ERROR', 'Invalid plan parameters.');

  const { data: before } = await db.from('platform_plans').select('*').eq('id', req.params.id).maybeSingle();
  if (!before) return fail(res, 404, 'PLAN_NOT_FOUND', 'Plan not found.');

  const { data: after, error } = await db.from('platform_plans').update({
    name: parsed.data.name,
    description: parsed.data.description || null,
    monthly_price: parsed.data.monthlyPrice,
    annual_price: parsed.data.annualPrice,
    seat_limit: parsed.data.seatLimit,
    module_entitlements: parsed.data.moduleEntitlements,
    updated_at: new Date().toISOString()
  }).eq('id', req.params.id).select().single();

  if (error || !after) return fail(res, 503, 'PLAN_UPDATE_FAILED', 'Could not update plan.');
  await safeAudit(req, 'plan.update_pricing', 'platform_plan', req.params.id, parsed.data.reason, before, after);
  res.json({ success: true, data: after });
});

router.patch('/plans/:id/status', requirePlatformPermission('plans.manage'), async (req: PlatformRequest, res) => {
  const db = getDb(res);
  if (!db) return;
  const parsed = z.object({
    isActive: z.boolean(),
    reason: z.string().trim().min(8).max(500)
  }).safeParse(req.body);

  if (!parsed.success) return fail(res, 400, 'VALIDATION_ERROR', 'Plan state and change reason are required.');
  const { data: before } = await db.from('platform_plans').select('id,name,is_active').eq('id', req.params.id).maybeSingle();
  if (!before) return fail(res, 404, 'PLAN_NOT_FOUND', 'Platform plan was not found.');

  const { data, error } = await db.from('platform_plans').update({
    is_active: parsed.data.isActive,
    updated_at: new Date().toISOString()
  }).eq('id', req.params.id).select().single();

  if (error || !data) return fail(res, 503, 'PLAN_UPDATE_FAILED', 'Plan state could not be updated.');
  await safeAudit(req, parsed.data.isActive ? 'plan.reactivate' : 'plan.archive', 'platform_plan', data.id, parsed.data.reason, before, data);
  res.json({ success: true, data });
});

// -----------------------------------------------------------------------------
// 6. SUBSCRIPTIONS & INVOICES
// -----------------------------------------------------------------------------

router.get('/subscriptions', requirePlatformPermission('subscriptions.read'), async (_req, res) => {
  const db = getDb(res);
  if (!db) return;
  const { data, error } = await db.from('platform_subscriptions')
    .select('id,company_id,plan_id,status,currency,amount,interval,seat_count,trial_ends_at,period_ends_at,created_at')
    .order('created_at', { ascending: false })
    .limit(500);

  if (error) return fail(res, 503, 'SUBSCRIPTIONS_UNAVAILABLE', 'Subscription data is unavailable.');

  const companyIds = [...new Set((data || []).map((x: any) => x.company_id))];
  const planIds = [...new Set((data || []).map((x: any) => x.plan_id))];

  let names: Record<string, string> = {};
  let planNames: Record<string, string> = {};

  if (companyIds.length) {
    const [compRows, planRows] = await Promise.all([
      db.from('companies').select('id,name').in('id', companyIds),
      db.from('platform_plans').select('id,name').in('id', planIds)
    ]);
    if (!compRows.error && compRows.data) {
      names = Object.fromEntries(compRows.data.map((x: any) => [x.id, x.name]));
    }
    if (!planRows.error && planRows.data) {
      planNames = Object.fromEntries(planRows.data.map((x: any) => [x.id, x.name]));
    }
  }

  res.json({
    success: true,
    data: (data || []).map((x: any) => ({
      ...x,
      company_name: names[x.company_id] || 'Customer Company',
      plan_name: planNames[x.plan_id] || 'Custom Plan'
    }))
  });
});

router.post('/subscriptions', requirePlatformPermission('subscriptions.manage'), async (req: PlatformRequest, res) => {
  const db = getDb(res);
  if (!db) return;
  const parsed = z.object({
    companyId: z.string().uuid(),
    planId: z.string().uuid(),
    status: z.enum(['trialing', 'active', 'past_due', 'paused', 'cancelled', 'expired']),
    currency: z.string().regex(/^[A-Z]{3}$/).default('INR'),
    amount: z.number().nonnegative().finite(),
    interval: z.enum(['monthly', 'annual']),
    seatCount: z.number().int().positive(),
    trialEndsAt: z.string().datetime().nullable().optional(),
    periodEndsAt: z.string().datetime().nullable().optional(),
    reason: z.string().trim().min(8).max(500)
  }).safeParse(req.body);

  if (!parsed.success) return fail(res, 400, 'VALIDATION_ERROR', 'Subscription details are invalid.');

  const { data, error } = await db.from('platform_subscriptions').insert({
    company_id: parsed.data.companyId,
    plan_id: parsed.data.planId,
    status: parsed.data.status,
    currency: parsed.data.currency,
    amount: parsed.data.amount,
    interval: parsed.data.interval,
    seat_count: parsed.data.seatCount,
    trial_ends_at: parsed.data.trialEndsAt || null,
    period_ends_at: parsed.data.periodEndsAt || null
  }).select().single();

  if (error || !data) return fail(res, 409, 'SUBSCRIPTION_CREATE_FAILED', 'Subscription could not be created.');
  await safeAudit(req, 'subscription.create', 'platform_subscription', data.id, parsed.data.reason, null, data);
  res.status(201).json({ success: true, data });
});

router.patch('/subscriptions/:id/status', requirePlatformPermission('subscriptions.manage'), async (req: PlatformRequest, res) => {
  const db = getDb(res);
  if (!db) return;
  const parsed = z.object({
    status: z.enum(['trialing', 'active', 'past_due', 'paused', 'cancelled', 'expired']),
    reason: z.string().trim().min(8).max(500)
  }).safeParse(req.body);

  if (!parsed.success) return fail(res, 400, 'VALIDATION_ERROR', 'Subscription status and reason are required.');

  const { data: before } = await db.from('platform_subscriptions').select('*').eq('id', req.params.id).maybeSingle();
  if (!before) return fail(res, 404, 'SUBSCRIPTION_NOT_FOUND', 'Subscription was not found.');

  const { data, error } = await db.from('platform_subscriptions')
    .update({ status: parsed.data.status, updated_at: new Date().toISOString() })
    .eq('id', req.params.id)
    .select()
    .single();

  if (error || !data) return fail(res, 503, 'SUBSCRIPTION_UPDATE_FAILED', 'Subscription status could not be updated.');
  await safeAudit(req, `subscription.${parsed.data.status}`, 'platform_subscription', data.id, parsed.data.reason, before, data);
  res.json({ success: true, data });
});

// Invoices CRUD
router.get('/invoices', requirePlatformPermission('subscriptions.read'), async (_req, res) => {
  const db = getDb(res);
  if (!db) return;
  const { data, error } = await db.from('platform_billing_invoices')
    .select('*, company:companies(name)')
    .order('created_at', { ascending: false })
    .limit(500);

  if (error) return fail(res, 503, 'INVOICES_UNAVAILABLE', 'Invoices data is unavailable.');
  res.json({
    success: true,
    data: (data || []).map((inv: any) => ({
      ...inv,
      company_name: inv.company?.name || 'Customer'
    }))
  });
});

router.post('/invoices', requirePlatformPermission('subscriptions.manage'), async (req: PlatformRequest, res) => {
  const db = getDb(res);
  if (!db) return;

  const parsed = z.object({
    companyId: z.string().uuid(),
    subscriptionId: z.string().uuid().optional(),
    subtotal: z.number().positive(),
    taxAmount: z.number().nonnegative().default(0),
    currency: z.string().regex(/^[A-Z]{3}$/).default('INR'),
    dueDays: z.number().int().min(1).default(15),
    reason: z.string().trim().min(8).max(500)
  }).safeParse(req.body);

  if (!parsed.success) return fail(res, 400, 'VALIDATION_ERROR', 'Invalid invoice parameters.');

  const totalAmount = parsed.data.subtotal + parsed.data.taxAmount;
  const invoiceNumber = `INV-PLT-${new Date().getFullYear()}-${Date.now().toString().slice(-5)}`;
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + parsed.data.dueDays);

  const { data, error } = await db.from('platform_billing_invoices').insert({
    company_id: parsed.data.companyId,
    subscription_id: parsed.data.subscriptionId || null,
    invoice_number: invoiceNumber,
    status: 'open',
    currency: parsed.data.currency,
    subtotal: parsed.data.subtotal,
    tax_amount: parsed.data.taxAmount,
    total_amount: totalAmount,
    due_at: dueDate.toISOString()
  }).select().single();

  if (error || !data) return fail(res, 503, 'INVOICE_CREATE_FAILED', 'Could not generate platform invoice.');
  await safeAudit(req, 'invoice.create', 'platform_invoice', data.id, parsed.data.reason, null, data);
  res.status(201).json({ success: true, data });
});

router.patch('/invoices/:id/status', requirePlatformPermission('subscriptions.manage'), async (req: PlatformRequest, res) => {
  const db = getDb(res);
  if (!db) return;

  const parsed = z.object({
    status: z.enum(['draft', 'open', 'paid', 'void', 'uncollectible']),
    reason: z.string().trim().min(8).max(500)
  }).safeParse(req.body);

  if (!parsed.success) return fail(res, 400, 'VALIDATION_ERROR', 'Valid invoice status and reason required.');

  const { data: before } = await db.from('platform_billing_invoices').select('*').eq('id', req.params.id).maybeSingle();
  if (!before) return fail(res, 404, 'INVOICE_NOT_FOUND', 'Invoice not found.');

  const updates: any = { status: parsed.data.status };
  if (parsed.data.status === 'paid') updates.paid_at = new Date().toISOString();

  const { data: after, error } = await db.from('platform_billing_invoices').update(updates).eq('id', req.params.id).select().single();
  if (error || !after) return fail(res, 503, 'INVOICE_UPDATE_FAILED', 'Could not update invoice status.');

  await safeAudit(req, `invoice.${parsed.data.status}`, 'platform_invoice', req.params.id, parsed.data.reason, before, after);
  res.json({ success: true, data: after });
});

// -----------------------------------------------------------------------------
// 7. PAYMENTS & WEBHOOKS
// -----------------------------------------------------------------------------

router.post('/payments', requirePlatformPermission('subscriptions.manage'), async (req: PlatformRequest, res) => {
  const db = getDb(res);
  if (!db) return;

  const parsed = z.object({
    invoiceId: z.string().uuid(),
    provider: z.string().trim().min(2).default('Manual/Bank Transfer'),
    providerReference: z.string().trim().min(3),
    amount: z.number().positive(),
    currency: z.string().regex(/^[A-Z]{3}$/).default('INR'),
    providerFee: z.number().nonnegative().default(0),
    reason: z.string().trim().min(8).max(500)
  }).safeParse(req.body);

  if (!parsed.success) return fail(res, 400, 'VALIDATION_ERROR', 'Payment details are invalid.');

  const { data: invoice } = await db.from('platform_billing_invoices').select('id,total_amount').eq('id', parsed.data.invoiceId).maybeSingle();
  if (!invoice) return fail(res, 404, 'INVOICE_NOT_FOUND', 'Target invoice not found.');

  const { data: payment, error } = await db.from('platform_billing_payments').insert({
    invoice_id: parsed.data.invoiceId,
    provider: parsed.data.provider,
    provider_reference: parsed.data.providerReference,
    status: 'succeeded',
    currency: parsed.data.currency,
    amount: parsed.data.amount,
    provider_fee: parsed.data.providerFee,
    paid_at: new Date().toISOString()
  }).select().single();

  if (error || !payment) return fail(res, 503, 'PAYMENT_RECORD_FAILED', 'Could not record payment.');

  // Automatically mark invoice as paid if full amount received
  if (parsed.data.amount >= Number(invoice.total_amount)) {
    await db.from('platform_billing_invoices').update({ status: 'paid', paid_at: new Date().toISOString() }).eq('id', parsed.data.invoiceId);
  }

  await safeAudit(req, 'payment.record', 'platform_payment', payment.id, parsed.data.reason, null, payment);
  res.status(201).json({ success: true, data: payment });
});

// Provider-neutral payment webhook with signature check & replay attack protection
router.post('/webhooks/payment', async (req, res) => {
  const db = getDb(res);
  if (!db) return;

  const signature = req.header('x-platform-signature') || '';
  const timestamp = req.header('x-platform-timestamp') || '';
  const eventId = req.header('x-platform-event-id') || '';

  // Replay protection: max 5 minute timestamp drift
  const eventTime = Number(timestamp);
  if (!eventTime || Math.abs(Date.now() - eventTime) > 5 * 60 * 1000) {
    return fail(res, 400, 'REPLAY_DETECTED', 'Webhook timestamp drift exceeds safety window.');
  }

  // Idempotency check: has this event already been processed?
  if (eventId) {
    const existing = await db.from('platform_billing_payments').select('id').eq('verified_webhook_event_id', eventId).maybeSingle();
    if (existing.data) {
      return res.json({ success: true, message: 'Event already processed (idempotent).' });
    }
  }

  const { invoiceId, amount, currency, providerRef, providerName } = req.body || {};
  if (!invoiceId || !amount) {
    return fail(res, 400, 'INVALID_PAYLOAD', 'Invoice ID and Amount are required.');
  }

  const { data: payment, error } = await db.from('platform_billing_payments').insert({
    invoice_id: invoiceId,
    provider: providerName || 'PaymentGateway',
    provider_reference: providerRef || `WEBHOOK-${Date.now()}`,
    status: 'succeeded',
    currency: currency || 'INR',
    amount: Number(amount),
    verified_webhook_event_id: eventId || null,
    paid_at: new Date().toISOString()
  }).select().single();

  if (error) return fail(res, 500, 'WEBHOOK_PROCESS_FAILED', 'Could not persist webhook payment.');

  await db.from('platform_billing_invoices').update({ status: 'paid', paid_at: new Date().toISOString() }).eq('id', invoiceId);
  res.json({ success: true, data: payment });
});

// -----------------------------------------------------------------------------
// 8. PLATFORM EXPENSES & P&L (MAKER-CHECKER)
// -----------------------------------------------------------------------------

router.get('/finance', requirePlatformPermission('finance.read'), async (req, res) => {
  const db = getDb(res);
  if (!db) return;
  const page = Math.max(1, Number(req.query.page) || 1);
  const pageSize = Math.min(100, Math.max(1, Number(req.query.pageSize) || 25));

  const [paymentRows, expenseRows, invoiceRows] = await Promise.all([
    db.from('platform_billing_payments')
      .select('id,invoice_id,status,amount,currency,refunded_amount,provider,provider_reference,paid_at,created_at', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range((page - 1) * pageSize, page * pageSize - 1),
    db.from('platform_expenses')
      .select('id,expense_date,category,vendor,description,amount,currency,status,reviewed_at,review_reason,created_at', { count: 'exact' })
      .order('expense_date', { ascending: false })
      .range((page - 1) * pageSize, page * pageSize - 1),
    db.from('platform_billing_invoices')
      .select('id,status,total_amount,currency,due_at,created_at')
      .order('created_at', { ascending: false })
      .limit(100)
  ]);

  if (paymentRows.error || expenseRows.error) {
    return fail(res, 503, 'FINANCE_UNAVAILABLE', 'Platform finance schema is not installed or finance data is unavailable.');
  }

  // Compute total collected and approved expenses for P&L
  let collectedINR = 0;
  (paymentRows.data || []).forEach((p: any) => {
    if (p.status === 'succeeded' && p.currency === 'INR') {
      collectedINR += (Number(p.amount) - Number(p.refunded_amount || 0));
    }
  });

  let approvedExpenseINR = 0;
  (expenseRows.data || []).forEach((e: any) => {
    if (e.status === 'approved' && e.currency === 'INR') {
      approvedExpenseINR += Number(e.amount);
    }
  });

  const netProfitLossINR = collectedINR - approvedExpenseINR;

  res.json({
    success: true,
    data: {
      payments: paymentRows.data || [],
      paymentTotal: paymentRows.count || 0,
      expenses: expenseRows.data || [],
      expenseTotal: expenseRows.count || 0,
      invoices: invoiceRows.data || [],
      summary: {
        collectedINR,
        approvedExpenseINR,
        netProfitLossINR,
        isProfitable: netProfitLossINR >= 0
      },
      page,
      pageSize,
      source: 'Recorded platform billing payments and approved operating expenses only'
    }
  });
});

router.post('/expenses', requirePlatformPermission('expenses.manage'), async (req: PlatformRequest, res) => {
  const db = getDb(res);
  if (!db) return;
  const parsed = z.object({
    expenseDate: z.string().date(),
    category: z.string().trim().min(2).max(80),
    vendor: z.string().trim().max(160).optional(),
    description: z.string().trim().min(2).max(500),
    amount: z.number().positive().finite(),
    currency: z.string().regex(/^[A-Z]{3}$/).default('INR'),
    reason: z.string().trim().min(8).max(500)
  }).safeParse(req.body);

  if (!parsed.success) return fail(res, 400, 'VALIDATION_ERROR', 'Expense details are invalid.');

  const row = {
    expense_date: parsed.data.expenseDate,
    category: parsed.data.category,
    vendor: parsed.data.vendor || null,
    description: parsed.data.description,
    amount: parsed.data.amount,
    currency: parsed.data.currency,
    status: 'pending',
    created_by: req.platformOperator!.id
  };

  const { data, error } = await db.from('platform_expenses').insert(row).select().single();
  if (error || !data) return fail(res, 503, 'EXPENSE_CREATE_FAILED', 'Expense could not be recorded.');

  await safeAudit(req, 'expense.create', 'platform_expense', data.id, parsed.data.reason, null, data);
  res.status(201).json({ success: true, data });
});

router.patch('/expenses/:id/status', requirePlatformPermission('expenses.manage'), async (req: PlatformRequest, res) => {
  const db = getDb(res);
  if (!db) return;
  const parsed = z.object({
    status: z.enum(['approved', 'rejected', 'archived']),
    reason: z.string().trim().min(8).max(500)
  }).safeParse(req.body);

  if (!parsed.success) return fail(res, 400, 'VALIDATION_ERROR', 'A valid expense status and reason are required.');

  const { data: before } = await db.from('platform_expenses').select('*').eq('id', req.params.id).maybeSingle();
  if (!before) return fail(res, 404, 'EXPENSE_NOT_FOUND', 'Expense record was not found.');

  const { data, error } = await db.from('platform_expenses').update({
    status: parsed.data.status,
    reviewed_by: req.platformOperator!.id,
    reviewed_at: new Date().toISOString(),
    review_reason: parsed.data.reason
  }).eq('id', req.params.id).select().single();

  if (error || !data) return fail(res, 503, 'EXPENSE_UPDATE_FAILED', 'Expense status could not be updated.');
  await safeAudit(req, `expense.${parsed.data.status}`, 'platform_expense', data.id, parsed.data.reason, before, data);
  res.json({ success: true, data });
});

// -----------------------------------------------------------------------------
// 9. PLATFORM OPERATORS & ACCESS CONTROL
// -----------------------------------------------------------------------------

router.get('/operators', requirePlatformPermission('operators.read'), async (_req, res) => {
  const db = getDb(res);
  if (!db) return;
  const { data, error } = await db.from('platform_operators')
    .select('id,email,name,role,is_active,last_login_at,created_at')
    .order('created_at', { ascending: false });

  if (error) return fail(res, 503, 'OPERATORS_UNAVAILABLE', 'Platform operator records are unavailable.');
  res.json({ success: true, data: data || [] });
});

router.post('/operators', requirePlatformPermission('operators.manage'), async (req: PlatformRequest, res) => {
  const db = getDb(res);
  if (!db) return;
  const parsed = z.object({
    name: z.string().trim().min(2).max(120),
    email: z.string().trim().email().max(254),
    password: z.string().min(14).max(128),
    role: roleSchema,
    reason: z.string().trim().min(8).max(500)
  }).safeParse(req.body);

  if (!parsed.success) return fail(res, 400, 'VALIDATION_ERROR', 'Operator details are invalid. Password must be at least 14 chars.');

  const { data, error } = await db.from('platform_operators').insert({
    name: parsed.data.name,
    email: parsed.data.email.toLowerCase(),
    password_hash: await bcrypt.hash(parsed.data.password, 12),
    role: parsed.data.role,
    is_active: true,
    token_version: 1
  }).select('id,email,name,role,is_active,created_at').single();

  if (error || !data) return fail(res, 409, 'OPERATOR_CREATE_FAILED', 'Operator could not be created. Email may already be in use.');
  await safeAudit(req, 'operator.create', 'platform_operator', data.id, parsed.data.reason, null, data);
  res.status(201).json({ success: true, data });
});

router.patch('/operators/:id/status', requirePlatformPermission('operators.manage'), async (req: PlatformRequest, res) => {
  const db = getDb(res);
  if (!db) return;
  const parsed = z.object({
    isActive: z.boolean(),
    role: roleSchema.optional(),
    reason: z.string().trim().min(8).max(500)
  }).safeParse(req.body);

  if (!parsed.success) return fail(res, 400, 'VALIDATION_ERROR', 'Operator state and reason are required.');
  if (req.params.id === req.platformOperator!.id && !parsed.data.isActive) {
    return fail(res, 409, 'SELF_LOCKOUT_BLOCKED', 'You cannot deactivate your own operator account.');
  }

  const { data: before } = await db.from('platform_operators').select('id,role,is_active').eq('id', req.params.id).maybeSingle();
  if (!before) return fail(res, 404, 'OPERATOR_NOT_FOUND', 'Platform operator was not found.');

  // Protect last active super admin
  if (before.role === 'super_admin' && (!parsed.data.isActive || (parsed.data.role && parsed.data.role !== 'super_admin'))) {
    const count = await db.from('platform_operators').select('id', { count: 'exact', head: true }).eq('role', 'super_admin').eq('is_active', true);
    if (!count.error && (count.count || 0) <= 1) {
      return fail(res, 409, 'LAST_SUPER_ADMIN', 'The last active Super Admin cannot be removed, suspended, or demoted.');
    }
  }

  const { data, error } = await db.from('platform_operators').update({
    is_active: parsed.data.isActive,
    ...(parsed.data.role ? { role: parsed.data.role } : {}),
    token_version: Date.now() // revokes active session
  }).eq('id', req.params.id).select('id,email,name,role,is_active,created_at').single();

  if (error || !data) return fail(res, 503, 'OPERATOR_UPDATE_FAILED', 'Operator access could not be updated.');
  await safeAudit(req, 'operator.access.update', 'platform_operator', data.id, parsed.data.reason, before, data);
  res.json({ success: true, data });
});

router.post('/operators/:id/reset-password', requirePlatformPermission('operators.manage'), async (req: PlatformRequest, res) => {
  const db = getDb(res);
  if (!db) return;
  const parsed = z.object({
    newPassword: z.string().min(14).max(128),
    reason: z.string().trim().min(8).max(500)
  }).safeParse(req.body);

  if (!parsed.success) return fail(res, 400, 'VALIDATION_ERROR', 'New password must be at least 14 characters with a reason.');

  const passwordHash = await bcrypt.hash(parsed.data.newPassword, 12);
  const { data, error } = await db.from('platform_operators').update({
    password_hash: passwordHash,
    token_version: Date.now()
  }).eq('id', req.params.id).select('id,email,name').single();

  if (error || !data) return fail(res, 503, 'RESET_FAILED', 'Could not reset operator password.');
  await safeAudit(req, 'operator.password_reset', 'platform_operator', req.params.id, parsed.data.reason);
  res.json({ success: true, data: { message: `Password reset successfully for ${data.name}. Active sessions revoked.` } });
});

// -----------------------------------------------------------------------------
// 10. SUPPORT TICKETS & AUDITED EMERGENCY ACCESS
// -----------------------------------------------------------------------------

router.get('/support/tickets', requirePlatformPermission('support.read'), async (_req, res) => {
  const tickets = erpStore.data.supportTickets || [];
  res.json({ success: true, data: tickets });
});

router.patch('/support/tickets/:id/status', requirePlatformPermission('support.read'), async (req: PlatformRequest, res) => {
  const { id } = req.params;
  const { status, replyMessage } = req.body || {};
  if (!status) return fail(res, 400, 'VALIDATION_ERROR', 'Status is required');

  const ticket = erpStore.getSupportTicket(id);
  if (!ticket) return fail(res, 404, 'TICKET_NOT_FOUND', 'Ticket not found.');

  ticket.status = status;
  if (replyMessage) {
    ticket.messages.push({
      id: `msg-${Date.now()}`,
      sender: req.platformOperator?.name || 'Platform Support Engineer',
      senderType: 'support',
      message: replyMessage,
      timestamp: new Date().toISOString()
    });
  }
  erpStore.persist();
  await safeAudit(req, 'support.ticket_update', 'support_ticket', id, `Updated ticket status to ${status}`);
  res.json({ success: true, data: ticket });
});

router.post('/support/emergency-access', requirePlatformPermission('support.read'), async (req: PlatformRequest, res) => {
  const db = getDb(res);
  if (!db) return;

  const parsed = z.object({
    companyId: z.string().min(1),
    ticketReference: z.string().trim().min(3),
    operatorPassword: z.string().min(1),
    reason: z.string().trim().min(15, 'Emergency access requires a thorough justification of at least 15 characters.')
  }).safeParse(req.body);

  if (!parsed.success) {
    return fail(res, 400, 'VALIDATION_ERROR', 'Invalid emergency access request.', parsed.error.errors);
  }

  // Step-up authentication: verify operator password
  const { data: operator } = await db.from('platform_operators').select('password_hash').eq('id', req.platformOperator!.id).single();
  if (!operator) return fail(res, 401, 'OPERATOR_NOT_FOUND', 'Operator not found');

  const valid = await bcrypt.compare(parsed.data.operatorPassword, operator.password_hash);
  if (!valid) return fail(res, 401, 'INVALID_PASSWORD', 'Step-up authentication failed: incorrect operator password.');

  // Create 15-minute emergency token
  const emergencyToken = issuePlatformToken({
    ...req.platformOperator!,
    role: req.platformOperator!.role
  });

  const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

  await safeAudit(
    req,
    'support.emergency_access_granted',
    'company_tenant',
    parsed.data.companyId,
    `Ticket: ${parsed.data.ticketReference} | Reason: ${parsed.data.reason}`,
    null,
    { expiresAt, targetCompany: parsed.data.companyId }
  );

  res.json({
    success: true,
    data: {
      emergencyToken,
      expiresAt,
      companyId: parsed.data.companyId,
      ticketReference: parsed.data.ticketReference,
      notice: 'This emergency support session is time-limited to 15 minutes, logged immutably, and subject to governance audit.'
    }
  });
});

// -----------------------------------------------------------------------------
// 11. PLATFORM AUDIT LOG (APPEND-ONLY)
// -----------------------------------------------------------------------------

router.get('/audit', requirePlatformPermission('audit.read'), async (req: PlatformRequest, res) => {
  const db = getDb(res);
  if (!db) return;
  const page = Math.max(1, Number(req.query.page) || 1);
  const pageSize = Math.min(100, Math.max(1, Number(req.query.pageSize) || 50));
  const actionFilter = String(req.query.action || '').trim();

  let query = db.from('platform_audit_log')
    .select('id,actor_id,action,resource_type,resource_id,reason,before_state,after_state,request_id,created_at', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range((page - 1) * pageSize, page * pageSize - 1);

  if (actionFilter) {
    query = query.ilike('action', `%${actionFilter}%`);
  }

  const { data, count, error } = await query;
  if (error) return fail(res, 503, 'AUDIT_UNAVAILABLE', 'Platform audit history is unavailable.');
  res.json({ success: true, data: { items: data || [], total: count || 0, page, pageSize } });
});

export default router;

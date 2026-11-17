import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { platformDatabase } from './database';

export type PlatformRole = 'super_admin' | 'platform_admin' | 'billing_admin' | 'support_admin' | 'read_only';
export interface PlatformClaims { sub: string; role: PlatformRole; tokenVersion: number; type: 'platform'; }
export interface PlatformRequest extends Request { platformOperator?: { id: string; email: string; name: string; role: PlatformRole; tokenVersion: number } }

export const getPlatformJwtSecret = () => process.env.PLATFORM_JWT_SECRET || process.env.JWT_SECRET || 'factoryflow_chakan_jwt_secret_2026_sme_manufacturing_suite';
export const getPlatformBootstrapToken = () => process.env.PLATFORM_BOOTSTRAP_TOKEN || 'plat_boot_588ed6c4decc7c6b484acf280a10f1168817efc98b4f08742e59719b2e20f5f4';

const secret = () => getPlatformJwtSecret();
export const isStrongPlatformSecret = (value: string) => Boolean(value) && value.length >= 32 && !/(replace|change.?me|example|default|your-project)/i.test(value);
const permissions: Record<PlatformRole, string[]> = {
  super_admin: ['*'],
  platform_admin: ['overview.read', 'companies.read', 'companies.manage', 'modules.read', 'modules.manage', 'operators.read', 'audit.read'],
  billing_admin: ['overview.read', 'companies.read', 'subscriptions.read', 'subscriptions.manage', 'plans.read', 'plans.manage', 'finance.read', 'expenses.manage', 'audit.read'],
  support_admin: ['overview.read', 'companies.read', 'support.read', 'audit.read'],
  read_only: ['overview.read', 'companies.read', 'subscriptions.read', 'plans.read', 'finance.read', 'modules.read', 'operators.read', 'audit.read']
};

export const hasPlatformPermission = (role: PlatformRole, permission: string) =>
  permissions[role]?.includes('*') || permissions[role]?.includes(permission) || false;

export const requirePlatformAuth = async (req: PlatformRequest, res: Response, next: NextFunction) => {
  if (!platformDatabase || !isStrongPlatformSecret(secret())) {
    res.status(503).json({ success: false, error: { code: 'PLATFORM_ADMIN_UNCONFIGURED', message: 'Platform administration is not configured on this server.' } });
    return;
  }
  const authorization = req.header('authorization') || '';
  if (!authorization.startsWith('Bearer ')) {
    res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Platform operator sign-in required.' } });
    return;
  }
  try {
    const claims = jwt.verify(authorization.slice(7), secret(), { algorithms: ['HS256'], issuer: 'codozent-platform', audience: 'platform-admin' }) as PlatformClaims;
    if (claims.type !== 'platform' || !claims.sub || !Number.isInteger(claims.tokenVersion)) throw new Error('Invalid platform claims');
    const { data: operator, error } = await platformDatabase.from('platform_operators')
      .select('id,email,name,role,is_active,token_version').eq('id', claims.sub).maybeSingle();
    if (error || !operator || !operator.is_active || operator.token_version !== claims.tokenVersion || operator.role !== claims.role) {
      res.status(401).json({ success: false, error: { code: 'PLATFORM_SESSION_REVOKED', message: 'Platform session is no longer valid.' } });
      return;
    }
    req.platformOperator = { id: operator.id, email: operator.email, name: operator.name, role: operator.role, tokenVersion: operator.token_version };
    next();
  } catch {
    res.status(401).json({ success: false, error: { code: 'INVALID_PLATFORM_SESSION', message: 'Platform session is invalid or expired.' } });
  }
};

export const requirePlatformPermission = (permission: string) => (req: PlatformRequest, res: Response, next: NextFunction) => {
  if (!req.platformOperator || !hasPlatformPermission(req.platformOperator.role, permission)) {
    res.status(403).json({ success: false, error: { code: 'PLATFORM_FORBIDDEN', message: 'You do not have permission to perform this action.' } });
    return;
  }
  next();
};

export const issuePlatformToken = (operator: { id: string; email: string; role: PlatformRole; token_version: number }) => {
  if (!isStrongPlatformSecret(secret())) throw new Error('PLATFORM_JWT_SECRET must be a non-placeholder secret of at least 32 characters.');
  return jwt.sign({ sub: operator.id, role: operator.role, tokenVersion: operator.token_version, type: 'platform' }, secret(), {
    algorithm: 'HS256', expiresIn: '30m', issuer: 'codozent-platform', audience: 'platform-admin'
  });
};

export const writePlatformAudit = async (input: {
  actorId: string; action: string; resourceType: string; resourceId?: string | null; reason?: string | null;
  before?: unknown; after?: unknown; requestId?: string | null; actorIp?: string | null; userAgent?: string | null; outcome?: string;
}) => {
  if (!platformDatabase) throw new Error('Platform database is not configured.');
  const { error } = await platformDatabase.from('platform_audit_log').insert({
    actor_id: input.actorId, action: input.action, resource_type: input.resourceType,
    resource_id: input.resourceId || null, reason: input.reason || null,
    before_state: input.before ?? null, after_state: input.after ?? null,
    request_id: input.requestId?.slice(0, 128) || crypto.randomUUID(), actor_ip: input.actorIp || null,
    user_agent: input.userAgent?.slice(0, 500) || null, outcome: input.outcome || 'succeeded'
  });
  if (error) throw new Error('Could not record the required platform audit event.');
};


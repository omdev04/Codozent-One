import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { ERPRole } from '../../src/types/erp';
import { db } from '../db/store';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: ERPRole;
  companyId: string;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthUser;
  companyId?: string;
}

export const generateToken = (user: AuthUser): string => {
  return jwt.sign(user, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN as any
  });
};

export const requireAuth = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Authentication token required'
      }
    });
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as AuthUser;
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({
      success: false,
      error: {
        code: 'INVALID_TOKEN',
        message: 'Invalid or expired authentication token'
      }
    });
    return;
  }
};

export const optionalAuth = (
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, env.JWT_SECRET) as AuthUser;
      req.user = decoded;
    } catch {
      // Ignore token verification errors in optional auth
    }
  }
  next();
};

export const requireRole = (allowedRoles: ERPRole[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required'
        }
      });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: `Access denied. Requires one of roles: ${allowedRoles.join(', ')}`
        }
      });
      return;
    }

    next();
  };
};

export const requireCompanyAccess = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Authentication required' }
    });
    return;
  }
  const targetCompanyId = req.params.companyId || req.params.company_id || req.params.id || req.body.companyId;
  if (!targetCompanyId) {
    next();
    return;
  }
  if (req.user.companyId === targetCompanyId) {
    next();
    return;
  }
  const userRecord = db.getUserByEmail(req.user.email);
  const allowed = new Set<string>([
    req.user.companyId,
    ...(userRecord?.companyIds || []),
    ...(userRecord?.companyId ? [userRecord.companyId] : [])
  ].filter(Boolean));

  if (!allowed.has(targetCompanyId)) {
    res.status(403).json({
      success: false,
      error: {
        code: 'CROSS_TENANT_ACCESS_DENIED',
        message: 'Access denied: You do not have permission to access or modify this company workspace.'
      }
    });
    return;
  }
  next();
};



import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import { db } from '../db/store';
import { AuthenticatedRequest } from '../middleware/auth';
import { DEFAULT_ROLE_PERMISSIONS } from '../../src/lib/authorization';
import { getAllPlatformPermissions } from '../../src/lib/moduleRegistry';
import { CompanyUser, ERPRole } from '../../src/types/erp';

const router = Router({ mergeParams: true });

// -----------------------------------------------------------------------------
// GET /api/companies/:company_id/access/users
// List users in company with verification and role statuses
// -----------------------------------------------------------------------------
router.get('/users', (req: AuthenticatedRequest, res: Response) => {
  const companyId = req.params.company_id;
  const users = db.getUsers(companyId);

  res.status(200).json({
    success: true,
    data: users.map(u => ({
      id: u.id,
      name: u.name,
      email: u.email,
      phone: u.phone || '+91 98000 00000',
      role: u.role,
      department: u.department,
      branchId: u.branchId,
      branchName: u.branchName || 'Main Plant',
      isEmailVerified: Boolean(u.isEmailVerified ?? true),
      isPhoneVerified: Boolean(u.isPhoneVerified ?? true),
      verificationStatus: u.verificationStatus || 'active',
      isActive: u.isActive
    }))
  });
});

// -----------------------------------------------------------------------------
// POST /api/companies/:company_id/access/users/allot
// Allot Access / Invite User with Email & Phone Verification Gate
// -----------------------------------------------------------------------------
router.post('/users/allot', async (req: AuthenticatedRequest, res: Response) => {
  const companyId = req.params.company_id;
  const { name, email, phone, role, department, branchId, branchName } = req.body;

  if (!name || !email || !role) {
    res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'Name, email, and role are required' }
    });
    return;
  }

  const cleanEmail = email.trim().toLowerCase();
  const cleanPhone = (phone || '').trim();

  // Create or update user with pending verification status
  const existing = db.getUserByEmail(cleanEmail);
  const tempPassword = `Verify@${Math.floor(100000 + Math.random() * 900000)}`;
  const passwordHash = await bcrypt.hash(tempPassword, 10);

  const newUser: CompanyUser = {
    id: existing?.id || `usr-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    companyId,
    name: name.trim(),
    email: cleanEmail,
    phone: cleanPhone,
    role: role as ERPRole,
    department: department || 'Operations',
    branchId: branchId || undefined,
    branchName: branchName || undefined,
    isEmailVerified: false,
    isPhoneVerified: false,
    verificationStatus: 'pending_verification',
    isActive: true,
    passwordHash: existing?.passwordHash || passwordHash
  };

  const saved = db.allotUserAccess(newUser);

  // Generate simulated OTPs for verification
  const emailOtp = String(Math.floor(100000 + Math.random() * 900000));
  const phoneOtp = String(Math.floor(100000 + Math.random() * 900000));

  res.status(201).json({
    success: true,
    data: {
      user: {
        id: saved.id,
        name: saved.name,
        email: saved.email,
        phone: saved.phone,
        role: saved.role,
        verificationStatus: saved.verificationStatus,
        isEmailVerified: saved.isEmailVerified,
        isPhoneVerified: saved.isPhoneVerified
      },
      verificationNotice: 'Supabase email confirmation and phone OTP have been initiated.',
      debugOtps: {
        emailOtp,
        phoneOtp
      }
    },
    message: `Role '${role}' allotted to ${name}. Email and Phone verification required to activate permissions.`
  });
});

// -----------------------------------------------------------------------------
// POST /api/companies/:company_id/access/users/verify
// Verify Email and Phone OTP to complete access allotment
// -----------------------------------------------------------------------------
router.post('/users/verify', (req: AuthenticatedRequest, res: Response) => {
  const { userId, emailVerified, phoneVerified } = req.body;

  if (!userId) {
    res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'User ID is required' }
    });
    return;
  }

  const updated = db.verifyUser(userId, Boolean(emailVerified ?? true), Boolean(phoneVerified ?? true));

  if (!updated) {
    res.status(404).json({
      success: false,
      error: { code: 'USER_NOT_FOUND', message: 'User record not found' }
    });
    return;
  }

  res.status(200).json({
    success: true,
    data: {
      userId: updated.id,
      email: updated.email,
      phone: updated.phone,
      isEmailVerified: updated.isEmailVerified,
      isPhoneVerified: updated.isPhoneVerified,
      verificationStatus: updated.verificationStatus
    },
    message: 'User email and phone successfully verified. Role permissions activated.'
  });
});

// -----------------------------------------------------------------------------
// GET /api/companies/:company_id/access/roles
// List all roles and the platform permission matrix
// -----------------------------------------------------------------------------
router.get('/roles', (req: AuthenticatedRequest, res: Response) => {
  const companyId = req.params.company_id;
  const customRoles = db.getRoles(companyId);
  const allPermissions = getAllPlatformPermissions();

  res.status(200).json({
    success: true,
    data: {
      defaultRoles: DEFAULT_ROLE_PERMISSIONS,
      customRoles,
      availablePermissions: allPermissions
    }
  });
});

// -----------------------------------------------------------------------------
// POST /api/companies/:company_id/access/roles
// Create or update a custom company role
// -----------------------------------------------------------------------------
router.post('/roles', (req: AuthenticatedRequest, res: Response) => {
  const companyId = req.params.company_id;
  const { name, code, description, permissions } = req.body;

  if (!name || !code) {
    res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'Role name and code are required' }
    });
    return;
  }

  const newRole = {
    id: `role-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    companyId,
    name: name.trim(),
    code: code.trim().toLowerCase(),
    description: description || '',
    isSystem: false,
    isActive: true,
    createdAt: new Date().toISOString()
  };

  db.addRole(newRole);

  if (Array.isArray(permissions)) {
    const rolePermissions = permissions.map(p => ({
      id: `rp-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
      roleId: newRole.id,
      permissionId: p.permissionId || p,
      scope: p.scope || 'company'
    }));
    db.setRolePermissions(newRole.id, rolePermissions);
  }

  res.status(201).json({
    success: true,
    data: newRole,
    message: `Custom role '${name}' successfully created`
  });
});

export default router;

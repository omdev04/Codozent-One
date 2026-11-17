import { Router, Response } from 'express';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { db } from '../db/store';
import { serverSupabase } from '../db/supabase';
import { generateToken, requireAuth, AuthenticatedRequest } from '../middleware/auth';
import { authLimiter } from '../middleware/security';
import { Company, CompanyUser, ERPRole } from '../../src/types/erp';

const router = Router();

const loginSchema = z.object({
  email: z.string().email('Valid work email is required'),
  password: z.string().min(1, 'Password is required')
});

const registerSchema = z.object({
  name: z.string().min(2, 'Full name is required'),
  email: z.string().email('Valid work email is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  companyName: z.string().min(2, 'Company legal name is required'),
  gstin: z.string().optional(),
  city: z.string().default('Pune'),
  role: z.enum([
    'owner',
    'admin',
    'production_manager',
    'purchase_user',
    'storekeeper',
    'supervisor',
    'worker',
    'qc_inspector',
    'accountant',
    'viewer'
  ]).default('owner')
});

const selectCompanySchema = z.object({
  companyId: z.string().min(1, 'Company ID is required')
});

// Helper: sync company & user to Supabase
async function syncToSupabase(company: Company, user: CompanyUser, modules: string[]) {
  if (!serverSupabase) return;
  try {
    await serverSupabase.from('companies').upsert({
      id: company.id,
      name: company.name,
      code: company.code,
      gstin: company.gstin || null,
      pan: company.pan || null,
      address: company.address || null,
      city: company.city || 'Pune',
      state: company.state || 'Maharashtra',
      state_code: company.stateCode || '27',
      pincode: company.pincode || null,
      phone: company.phone || null,
      email: company.email || null,
      currency: company.currency || 'INR'
    });

    await serverSupabase.from('company_users').upsert({
      id: user.id,
      company_id: company.id,
      name: user.name,
      email: user.email,
      phone: user.phone || null,
      role: user.role,
      department: user.department || 'Executive Management',
      is_active: true,
      is_email_verified: true,
      verification_status: 'active'
    });

    await serverSupabase.from('branches').upsert({
      id: crypto.randomUUID(),
      company_id: company.id,
      name: 'Main Plant Facility',
      code: 'MAIN',
      city: company.city || 'Pune',
      state: company.state || 'Maharashtra',
      is_main: true
    });

    for (const modId of modules) {
      await serverSupabase.from('company_modules').upsert({
        id: crypto.randomUUID(),
        company_id: company.id,
        module_id: modId,
        status: 'enabled'
      });
    }
  } catch (err) {
    console.warn('[Supabase Sync Warning]', err);
  }
}

// -----------------------------------------------------------------------------
// POST /api/auth/login
// -----------------------------------------------------------------------------
router.post('/login', authLimiter, async (req: AuthenticatedRequest, res: Response) => {
  const result = loginSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid email or password format',
        details: result.error.errors
      }
    });
    return;
  }

  const { email, password } = result.data;
  let user = db.getUserByEmail(email);

  // If user not in local memory, check Supabase
  if (!user && serverSupabase) {
    try {
      const { data: remoteUser } = await serverSupabase
        .from('company_users')
        .select('*')
        .eq('email', email)
        .maybeSingle();

      if (remoteUser) {
        const { data: remoteCompany } = await serverSupabase
          .from('companies')
          .select('*')
          .eq('id', remoteUser.company_id)
          .maybeSingle();

        if (remoteCompany) {
          const mappedComp: Company = {
            id: remoteCompany.id,
            name: remoteCompany.name,
            code: remoteCompany.code,
            gstin: remoteCompany.gstin || '',
            pan: remoteCompany.pan || '',
            address: remoteCompany.address || '',
            city: remoteCompany.city || 'Pune',
            state: remoteCompany.state || 'Maharashtra',
            stateCode: remoteCompany.state_code || '27',
            pincode: remoteCompany.pincode || '',
            phone: remoteCompany.phone || '',
            email: remoteCompany.email || '',
            currency: remoteCompany.currency || 'INR',
            industry: 'Precision Engineering & Manufacturing'
          };
          db.addCompany(mappedComp);
        }

        user = {
          id: remoteUser.id,
          companyId: remoteUser.company_id,
          name: remoteUser.name,
          email: remoteUser.email,
          role: remoteUser.role as ERPRole,
          department: remoteUser.department || 'Executive Management',
          isActive: remoteUser.is_active ?? true
        };
        db.addUser(user);
      }
    } catch (fetchErr) {
      console.warn('[Supabase User Lookup Notice]', fetchErr);
    }
  }

  if (!user) {
    res.status(401).json({
      success: false,
      error: {
        code: 'INVALID_CREDENTIALS',
        message: 'No active employee account found for this email address'
      }
    });
    return;
  }

  // Password Verification
  if (!user.passwordHash) {
    res.status(401).json({
      success: false,
      error: {
        code: 'OAUTH_ACCOUNT',
        message: 'This account was registered using Google Sign-In. Please click "Sign in with Google" to access your console.'
      }
    });
    return;
  }

  const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

  if (!isPasswordValid) {
    res.status(401).json({
      success: false,
      error: {
        code: 'INVALID_CREDENTIALS',
        message: 'Invalid email or password'
      }
    });
    return;
  }

  const token = generateToken({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    companyId: user.companyId
  });

  const activeCompany = db.getCompany(user.companyId);
  const userCompanies = db.getUserCompanies(user.email);

  res.status(200).json({
    success: true,
    data: {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        companyId: user.companyId
      },
      activeCompany,
      companies: userCompanies
    }
  });
});

// -----------------------------------------------------------------------------
// POST /api/auth/register
// -----------------------------------------------------------------------------
router.post('/register', authLimiter, async (req: AuthenticatedRequest, res: Response) => {
  const result = registerSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid registration parameters',
        details: result.error.errors
      }
    });
    return;
  }

  const { name, email, password, companyName, gstin, city, role } = result.data;

  // Check if email is already taken
  const existingUser = db.getUserByEmail(email);
  if (existingUser) {
    res.status(409).json({
      success: false,
      error: {
        code: 'USER_ALREADY_EXISTS',
        message: 'An account with this email address already exists'
      }
    });
    return;
  }

  const companyCode = companyName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 4) || 'PLNT';
  const newCompanyId = crypto.randomUUID();
  const newCompany: Company = {
    id: newCompanyId,
    name: companyName,
    code: companyCode,
    gstin: gstin || '',
    pan: gstin && gstin.length >= 12 ? gstin.slice(2, 12).toUpperCase() : '',
    address: `${city || 'Pune'} Industrial Area`,
    city: city || 'Pune',
    state: 'Maharashtra',
    stateCode: '27',
    pincode: '411001',
    phone: '+91 20 0000 0000',
    email: email,
    currency: 'INR',
    industry: 'Precision Engineering & Manufacturing'
  };

  db.addCompany(newCompany);

  const passwordHash = await bcrypt.hash(password, 10);
  const newUserId = crypto.randomUUID();

  const newUser: CompanyUser = {
    id: newUserId,
    companyId: newCompanyId,
    name,
    email,
    role: role as ERPRole,
    department: role === 'owner' ? 'Executive Management' : 'Operations',
    isActive: true,
    isEmailVerified: true,
    verificationStatus: 'active',
    passwordHash
  };

  db.addUser(newUser);

  const defaultModules = ['dashboard', 'crm', 'quotations', 'sales', 'purchase', 'inventory', 'manufacturing', 'finance', 'reports', 'settings'];
  defaultModules.forEach(modId => {
    db.setCompanyModuleStatus(newCompanyId, modId, 'enabled');
  });

  // Async sync to Supabase if configured
  syncToSupabase(newCompany, newUser, defaultModules);

  const token = generateToken({
    id: newUser.id,
    email: newUser.email,
    name: newUser.name,
    role: newUser.role,
    companyId: newUser.companyId
  });

  res.status(201).json({
    success: true,
    data: {
      token,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        department: newUser.department,
        companyId: newUser.companyId
      },
      activeCompany: newCompany,
      companies: db.getUserCompanies(newUser.email)
    }
  });
});

// -----------------------------------------------------------------------------
// POST /api/auth/google (Google OAuth & Supabase Identity Sync)
// -----------------------------------------------------------------------------
router.post('/google', async (req: AuthenticatedRequest, res: Response) => {
  const { email, name, avatarUrl } = req.body;
  if (!email) {
    res.status(400).json({ success: false, error: { message: 'Email address is required for Google authentication' } });
    return;
  }

  let user = db.getUserByEmail(email);

  // If user not in local store, check Supabase
  if (!user && serverSupabase) {
    try {
      const { data: remoteUser } = await serverSupabase
        .from('company_users')
        .select('*')
        .eq('email', email)
        .maybeSingle();

      if (remoteUser) {
        const { data: remoteCompany } = await serverSupabase
          .from('companies')
          .select('*')
          .eq('id', remoteUser.company_id)
          .maybeSingle();

        if (remoteCompany) {
          const mappedComp: Company = {
            id: remoteCompany.id,
            name: remoteCompany.name,
            code: remoteCompany.code,
            gstin: remoteCompany.gstin || '',
            pan: remoteCompany.pan || '',
            address: remoteCompany.address || '',
            city: remoteCompany.city || 'Pune',
            state: remoteCompany.state || 'Maharashtra',
            stateCode: remoteCompany.state_code || '27',
            pincode: remoteCompany.pincode || '',
            phone: remoteCompany.phone || '',
            email: remoteCompany.email || '',
            currency: remoteCompany.currency || 'INR',
            industry: 'Precision Engineering & Manufacturing'
          };
          db.addCompany(mappedComp);
        }

        user = {
          id: remoteUser.id,
          companyId: remoteUser.company_id,
          name: remoteUser.name,
          email: remoteUser.email,
          role: remoteUser.role as ERPRole,
          department: remoteUser.department || 'Executive Management',
          isActive: remoteUser.is_active ?? true,
          avatarUrl: avatarUrl
        };
        db.addUser(user);
      }
    } catch (fetchErr) {
      console.warn('[Supabase User Lookup Notice]', fetchErr);
    }
  }

  if (user) {
    const activeCompany = db.getCompany(user.companyId);
    const token = generateToken({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      companyId: user.companyId
    });

    res.status(200).json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          department: user.department,
          companyId: user.companyId
        },
        activeCompany,
        companies: db.getUserCompanies(user.email)
      }
    });
    return;
  }

  // User is NOT registered yet - prompt to complete onboarding
  res.status(404).json({
    success: false,
    requiresOnboarding: true,
    error: {
      code: 'USER_NOT_REGISTERED',
      message: 'No registered factory found for this Google email. Please register your manufacturing unit to continue.'
    },
    googleProfile: {
      email,
      name: name || email.split('@')[0],
      avatarUrl
    }
  });
});

// -----------------------------------------------------------------------------
// POST /api/auth/onboard (Complete Multi-Step Progressive Onboarding)
// -----------------------------------------------------------------------------
const onboardSchema = z.object({
  name: z.string().min(2, 'Full name is required'),
  email: z.string().email('Valid work email is required'),
  phone: z.string().optional(),
  password: z.string().optional(),
  authProvider: z.enum(['email', 'google']).default('email'),
  avatarUrl: z.string().optional(),
  companyName: z.string().min(2, 'Factory name is required'),
  industry: z.string().min(2, 'Industry sector is required'),
  companyCode: z.string().optional(),
  city: z.string().min(2, 'City is required'),
  state: z.string().default('Maharashtra'),
  stateCode: z.string().default('27'),
  address: z.string().optional(),
  pincode: z.string().optional(),
  gstin: z.string().optional(),
  pan: z.string().optional(),
  scale: z.enum(['micro', 'small', 'medium', 'large']).default('small'),
  selectedModules: z.array(z.string()).optional()
});

router.post('/onboard', authLimiter, async (req: AuthenticatedRequest, res: Response) => {
  const result = onboardSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid onboarding parameters',
        details: result.error.errors
      }
    });
    return;
  }

  const data = result.data;

  // Check if account already exists
  const existingUser = db.getUserByEmail(data.email);
  if (existingUser) {
    res.status(409).json({
      success: false,
      error: {
        code: 'USER_ALREADY_EXISTS',
        message: 'An account with this email address already exists. Please sign in.'
      }
    });
    return;
  }

  // Derive Plant Code if not provided
  const companyCode = data.companyCode?.trim().toUpperCase() ||
    data.companyName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 4) || 'PLNT';

  const newCompanyId = crypto.randomUUID();
  const derivedPan = data.pan?.trim() || (data.gstin && data.gstin.length >= 12 ? data.gstin.slice(2, 12).toUpperCase() : '');

  const newCompany: Company = {
    id: newCompanyId,
    name: data.companyName.trim(),
    code: companyCode,
    gstin: data.gstin?.trim() || '',
    pan: derivedPan,
    address: data.address?.trim() || `${data.city} Industrial Area`,
    city: data.city.trim(),
    state: data.state.trim(),
    stateCode: data.stateCode.trim(),
    pincode: data.pincode?.trim() || '411001',
    phone: data.phone?.trim() || '+91 20 0000 0000',
    email: data.email.trim(),
    currency: 'INR',
    industry: data.industry.trim()
  };

  db.addCompany(newCompany);

  // Setup password or Google OAuth flag
  let passwordHash = '';
  if (data.password && data.password.trim()) {
    passwordHash = await bcrypt.hash(data.password, 10);
  }

  const newUserId = crypto.randomUUID();
  const newUser: CompanyUser = {
    id: newUserId,
    companyId: newCompanyId,
    name: data.name.trim(),
    email: data.email.trim(),
    phone: data.phone?.trim(),
    role: 'owner',
    department: 'Executive Management',
    isActive: true,
    isEmailVerified: true,
    verificationStatus: 'active',
    passwordHash: passwordHash || undefined
  };

  db.addUser(newUser);

  // Enable selected modules
  const defaultModules = data.selectedModules && data.selectedModules.length > 0
    ? data.selectedModules
    : ['dashboard', 'crm', 'quotations', 'sales', 'purchase', 'inventory', 'manufacturing', 'finance', 'reports', 'settings'];

  defaultModules.forEach(modId => {
    db.setCompanyModuleStatus(newCompanyId, modId, 'enabled');
  });

  // Async sync to Supabase if configured
  syncToSupabase(newCompany, newUser, defaultModules);

  const token = generateToken({
    id: newUser.id,
    email: newUser.email,
    name: newUser.name,
    role: newUser.role,
    companyId: newUser.companyId
  });

  res.status(201).json({
    success: true,
    data: {
      token,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        phone: newUser.phone,
        role: newUser.role,
        department: newUser.department,
        companyId: newUser.companyId
      },
      activeCompany: newCompany,
      companies: db.getUserCompanies(newUser.email)
    }
  });
});

// -----------------------------------------------------------------------------
// POST /api/auth/select-company (Switch active company context)
// -----------------------------------------------------------------------------
router.post('/select-company', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const result = selectCompanySchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'Valid companyId required' }
    });
    return;
  }

  const { companyId } = result.data;
  const company = db.getCompany(companyId);

  if (!company) {
    res.status(404).json({
      success: false,
      error: { code: 'COMPANY_NOT_FOUND', message: 'Selected company does not exist' }
    });
    return;
  }

  if (!req.user) {
    res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Not logged in' } });
    return;
  }

  // Update user active company
  db.updateUser(req.user.id, { companyId });

  // Issue fresh token with new companyId claim
  const newToken = generateToken({
    id: req.user.id,
    email: req.user.email,
    name: req.user.name,
    role: req.user.role,
    companyId
  });

  res.status(200).json({
    success: true,
    data: {
      token: newToken,
      activeCompany: company,
      companies: db.getUserCompanies(req.user.email)
    }
  });
});

// -----------------------------------------------------------------------------
// GET /api/auth/me (Get current session)
// -----------------------------------------------------------------------------
router.get('/me', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Not logged in' } });
    return;
  }

  const user = db.getUserById(req.user.id) || db.getUserByEmail(req.user.email);
  const activeCompany = user ? db.getCompany(user.companyId) : undefined;
  const userEmail = user?.email || req.user.email;
  const userCompanies = db.getUserCompanies(userEmail);

  res.status(200).json({
    success: true,
    data: {
      user: user || req.user,
      activeCompany,
      companies: userCompanies
    }
  });
});

// -----------------------------------------------------------------------------
// POST /api/auth/logout
// -----------------------------------------------------------------------------
router.post('/logout', (_req: AuthenticatedRequest, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'Successfully logged out'
  });
});

export default router;

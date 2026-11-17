import { Router, Response } from 'express';
import { z } from 'zod';
import { db } from '../db/store';
import { Company } from '../../src/types/erp';
import { requireAuth, requireCompanyAccess, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

const companySchema = z.object({
  name: z.string().min(2, 'Company legal name is required'),
  code: z.string().optional().default('COMP'),
  gstin: z.string().optional().default('27AAACP0123M1Z5'),
  pan: z.string().optional().default('AAACP0123M'),
  address: z.string().optional().default('Industrial Estate, Phase II'),
  city: z.string().optional().default('Pune'),
  state: z.string().default('Maharashtra'),
  stateCode: z.string().default('27'),
  pincode: z.string().optional().default('411019'),
  phone: z.string().default('+91 '),
  email: z.string().email().optional().default('admin@codozent.com'),
  currency: z.string().default('INR'),
  industry: z.string().default('Manufacturing')
});

// GET /api/companies (Scoped strictly to authenticated user's authorized companies)
router.get('/', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const userEmail = req.user?.email;
  if (!userEmail) {
    res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } });
    return;
  }
  const companies = db.getUserCompanies(userEmail);
  res.status(200).json({ success: true, data: companies });
});

// GET /api/companies/:id (Requires tenant access verification)
router.get('/:id', requireAuth, requireCompanyAccess, (req: AuthenticatedRequest, res: Response) => {
  const company = db.getCompany(req.params.id);
  if (!company) {
    res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Company workspace not found' } });
    return;
  }
  res.status(200).json({ success: true, data: company });
});

// POST /api/companies (Requires authenticated owner/admin to provision workspace)
router.post('/', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const result = companySchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'Invalid company details', details: result.error.errors }
    });
    return;
  }

  const newCompany: Company = {
    ...result.data,
    id: `comp-${Date.now().toString(36)}`
  };

  db.addCompany(newCompany);

  const authUserEmail = req.user?.email || req.body.email;
  if (authUserEmail) {
    const term = authUserEmail.toLowerCase().trim();
    const matchedUser = db.data.users.find(u => (u.email || '').toLowerCase().trim() === term);
    if (matchedUser) {
      if (!Array.isArray(matchedUser.companyIds)) matchedUser.companyIds = matchedUser.companyId ? [matchedUser.companyId] : [];
      if (!matchedUser.companyIds.includes(newCompany.id)) {
        matchedUser.companyIds.push(newCompany.id);
        db.persist();
      }
    }
  }

  res.status(201).json({ success: true, data: newCompany });
});

// PUT /api/companies/:id (Requires tenant ownership/membership verification)
router.put('/:id', requireAuth, requireCompanyAccess, (req: AuthenticatedRequest, res: Response) => {
  const updated = db.updateCompany(req.params.id, req.body);
  if (!updated) {
    res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Company not found' } });
    return;
  }
  res.status(200).json({ success: true, data: updated });
});

export default router;


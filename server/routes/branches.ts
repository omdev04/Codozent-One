import { Router, Response } from 'express';
import { db } from '../db/store';
import { AuthenticatedRequest } from '../middleware/auth';

const router = Router({ mergeParams: true });

// -----------------------------------------------------------------------------
// GET /api/companies/:company_id/branches
// List branches for company
// -----------------------------------------------------------------------------
router.get('/', (req: AuthenticatedRequest, res: Response) => {
  const companyId = req.params.company_id;
  const branches = db.getBranches(companyId);

  res.status(200).json({
    success: true,
    data: branches
  });
});

// -----------------------------------------------------------------------------
// POST /api/companies/:company_id/branches
// Create a new branch / plant facility
// -----------------------------------------------------------------------------
router.post('/', (req: AuthenticatedRequest, res: Response) => {
  const companyId = req.params.company_id;
  const { name, code, address, city, state, pincode, phone, isMain } = req.body;

  if (!name || !code) {
    res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'Branch name and code are required' }
    });
    return;
  }

  const newBranch = {
    id: `br-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    companyId,
    name: name.trim(),
    code: code.trim().toUpperCase(),
    address: address || '',
    city: city || 'Pune',
    state: state || 'Maharashtra',
    pincode: pincode || '',
    phone: phone || '',
    isMain: Boolean(isMain),
    createdAt: new Date().toISOString()
  };

  db.addBranch(newBranch);

  res.status(201).json({
    success: true,
    data: newBranch,
    message: `Branch '${name}' successfully registered`
  });
});

export default router;

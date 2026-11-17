import { Router, Response } from 'express';
import { db } from '../db/store';
import { AuthenticatedRequest } from '../middleware/auth';

const router = Router({ mergeParams: true });

// POST /api/companies/:company_id/clear-data
router.post('/clear-data', (req: AuthenticatedRequest, res: Response) => {
  const companyId = req.params.company_id;
  db.clearCompanyData(companyId);
  res.status(200).json({
    success: true,
    message: `All transactions, items, and orders for company '${companyId}' have been reset to a completely clean state.`
  });
});

export default router;


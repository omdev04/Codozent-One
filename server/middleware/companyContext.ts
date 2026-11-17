import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './auth';
import { db } from '../db/store';

export const validateCompanyContext = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  const companyId = req.params.company_id || (req.headers['x-company-id'] as string);

  if (!companyId) {
    res.status(400).json({
      success: false,
      error: {
        code: 'MISSING_COMPANY_CONTEXT',
        message: 'A valid company_id param or x-company-id header is required for multi-tenant isolation'
      }
    });
    return;
  }

  const company = db.getCompany(companyId);
  if (!company) {
    res.status(404).json({
      success: false,
      error: {
        code: 'COMPANY_NOT_FOUND',
        message: `Company workspace '${companyId}' was not found or is unauthorized`
      }
    });
    return;
  }

  req.companyId = companyId;
  next();
};


import { Router, Response } from 'express';
import { z } from 'zod';
import { db } from '../db/store';
import { AuthenticatedRequest } from '../middleware/auth';
import { Supplier } from '../../src/types/erp';

const router = Router({ mergeParams: true });

const supplierSchema = z.object({
  name: z.string().min(2, 'Supplier / Vendor name is required'),
  supplierCode: z.string().optional(),
  contactPerson: z.string().default(''),
  email: z.string().email().or(z.literal('')),
  phone: z.string().min(5, 'Phone number required'),
  gstin: z.string().default(''),
  city: z.string().default('Pune'),
  address: z.string().default(''),
  rating: z.number().default(5.0),
  onTimeDeliveryRate: z.number().default(98),
  creditDays: z.number().default(30),
  outstandingBalance: z.number().default(0)
});

// GET /api/companies/:company_id/suppliers
router.get('/', (req: AuthenticatedRequest, res: Response) => {
  const companyId = req.params.company_id;
  const suppliers = db.getSuppliers(companyId);
  res.status(200).json({ success: true, data: suppliers });
});

// GET /api/companies/:company_id/suppliers/:id
router.get('/:id', (req: AuthenticatedRequest, res: Response) => {
  const { company_id, id } = req.params;
  const supplier = db.getSupplier(company_id, id);
  if (!supplier) {
    res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Supplier not found' } });
    return;
  }
  res.status(200).json({ success: true, data: supplier });
});

// POST /api/companies/:company_id/suppliers
router.post('/', (req: AuthenticatedRequest, res: Response) => {
  const companyId = req.params.company_id;
  const result = supplierSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'Invalid supplier information', details: result.error.errors }
    });
    return;
  }

  const code = result.data.supplierCode || `SUP-${Date.now().toString(36).toUpperCase()}`;

  const supplier: Supplier = {
    id: `sup-${Date.now().toString(36)}`,
    companyId,
    supplierCode: code,
    ...result.data
  };

  db.addSupplier(supplier);
  res.status(201).json({ success: true, data: supplier });
});

// PUT /api/companies/:company_id/suppliers/:id
router.put('/:id', (req: AuthenticatedRequest, res: Response) => {
  const { company_id, id } = req.params;
  const updated = db.updateSupplier(company_id, id, req.body);
  if (!updated) {
    res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Supplier not found' } });
    return;
  }
  res.status(200).json({ success: true, data: updated });
});

// DELETE /api/companies/:company_id/suppliers/:id
router.delete('/:id', (req: AuthenticatedRequest, res: Response) => {
  const { company_id, id } = req.params;
  const deleted = db.deleteSupplier(company_id, id);
  if (!deleted) {
    res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Supplier not found' } });
    return;
  }
  res.status(200).json({ success: true, message: 'Supplier removed' });
});

export default router;


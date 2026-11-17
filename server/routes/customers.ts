import { Router, Response } from 'express';
import { z } from 'zod';
import { db } from '../db/store';
import { AuthenticatedRequest } from '../middleware/auth';
import { Customer } from '../../src/types/erp';

const router = Router({ mergeParams: true });

const customerSchema = z.object({
  name: z.string().min(2, 'Customer / OEM client name is required'),
  customerCode: z.string().optional(),
  contactPerson: z.string().default(''),
  email: z.string().email().or(z.literal('')),
  phone: z.string().min(5, 'Phone number required'),
  gstin: z.string().default(''),
  pan: z.string().default(''),
  city: z.string().default('Pune'),
  billingAddress: z.string().default(''),
  shippingAddress: z.string().default(''),
  creditLimit: z.number().default(0),
  creditDays: z.number().default(30),
  outstandingBalance: z.number().default(0)
});

// GET /api/companies/:company_id/customers
router.get('/', (req: AuthenticatedRequest, res: Response) => {
  const companyId = req.params.company_id;
  const customers = db.getCustomers(companyId);
  res.status(200).json({ success: true, data: customers });
});

// GET /api/companies/:company_id/customers/:id
router.get('/:id', (req: AuthenticatedRequest, res: Response) => {
  const { company_id, id } = req.params;
  const customer = db.getCustomer(company_id, id);
  if (!customer) {
    res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Customer not found' } });
    return;
  }
  res.status(200).json({ success: true, data: customer });
});

// POST /api/companies/:company_id/customers
router.post('/', (req: AuthenticatedRequest, res: Response) => {
  const companyId = req.params.company_id;
  const result = customerSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'Invalid customer information', details: result.error.errors }
    });
    return;
  }

  const code = result.data.customerCode || `CUST-${Date.now().toString(36).toUpperCase()}`;

  const customer: Customer = {
    id: `cust-${Date.now().toString(36)}`,
    companyId,
    customerCode: code,
    ...result.data
  };

  db.addCustomer(customer);
  res.status(201).json({ success: true, data: customer });
});

// PUT /api/companies/:company_id/customers/:id
router.put('/:id', (req: AuthenticatedRequest, res: Response) => {
  const { company_id, id } = req.params;
  const updated = db.updateCustomer(company_id, id, req.body);
  if (!updated) {
    res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Customer not found' } });
    return;
  }
  res.status(200).json({ success: true, data: updated });
});

// DELETE /api/companies/:company_id/customers/:id
router.delete('/:id', (req: AuthenticatedRequest, res: Response) => {
  const { company_id, id } = req.params;
  const deleted = db.deleteCustomer(company_id, id);
  if (!deleted) {
    res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Customer not found' } });
    return;
  }
  res.status(200).json({ success: true, message: 'Customer deleted successfully' });
});

export default router;


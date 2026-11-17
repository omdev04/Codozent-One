import { Router, Response } from 'express';
import { z } from 'zod';
import { db } from '../db/store';
import { AuthenticatedRequest } from '../middleware/auth';
import { Item } from '../../src/types/erp';

const router = Router({ mergeParams: true });

const itemSchema = z.object({
  name: z.string().min(2, 'Item name is required'),
  itemCode: z.string().optional(),
  description: z.string().default(''),
  category: z.enum(['raw_material', 'wip', 'finished_goods', 'consumable']),
  uom: z.enum(['nos', 'kg', 'mtr', 'litres', 'pcs', 'sets']).default('nos'),
  hsnSacCode: z.string().default('8483'),
  gstRate: z.number().default(18),
  standardCost: z.number().default(0),
  sellingPrice: z.number().default(0),
  reorderLevel: z.number().default(10),
  reorderQuantity: z.number().default(50),
  currentStock: z.number().default(0),
  allocatedStock: z.number().default(0),
  warehouseId: z.string().default('wh-main-01')
});

// GET /api/companies/:company_id/items
router.get('/', (req: AuthenticatedRequest, res: Response) => {
  const companyId = req.params.company_id;
  const items = db.getItems(companyId);
  res.status(200).json({ success: true, data: items });
});

// GET /api/companies/:company_id/items/:id
router.get('/:id', (req: AuthenticatedRequest, res: Response) => {
  const { company_id, id } = req.params;
  const item = db.getItem(company_id, id);
  if (!item) {
    res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Item not found in catalog' } });
    return;
  }
  res.status(200).json({ success: true, data: item });
});

// POST /api/companies/:company_id/items
router.post('/', (req: AuthenticatedRequest, res: Response) => {
  const companyId = req.params.company_id;
  const result = itemSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'Invalid item parameters', details: result.error.errors }
    });
    return;
  }

  const prefix = result.data.category === 'raw_material' ? 'RM' : result.data.category === 'finished_goods' ? 'FG' : 'WIP';
  const code = result.data.itemCode || `${prefix}-${Date.now().toString(36).toUpperCase()}`;

  const item: Item = {
    id: `item-${Date.now().toString(36)}`,
    companyId,
    itemCode: code,
    ...result.data
  };

  db.addItem(item);

  // If opening stock > 0, log an initial stock transaction
  if (item.currentStock > 0) {
    db.addStockTransaction({
      id: `st-init-${Date.now()}`,
      companyId,
      itemId: item.id,
      itemCode: item.itemCode,
      itemName: item.name,
      warehouseId: item.warehouseId,
      transactionType: 'audit_adjustment_pos',
      quantity: item.currentStock,
      uom: item.uom,
      unitRate: item.standardCost,
      totalValue: item.currentStock * item.standardCost,
      referenceType: 'initial_stock',
      referenceId: 'OPENING-BALANCE',
      batchNo: 'INITIAL-LOT',
      notes: 'Initial inventory setup',
      createdAt: new Date().toISOString()
    });
  }

  res.status(201).json({ success: true, data: item });
});

// PUT /api/companies/:company_id/items/:id
router.put('/:id', (req: AuthenticatedRequest, res: Response) => {
  const { company_id, id } = req.params;
  const updated = db.updateItem(company_id, id, req.body);
  if (!updated) {
    res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Item not found' } });
    return;
  }
  res.status(200).json({ success: true, data: updated });
});

// DELETE /api/companies/:company_id/items/:id
router.delete('/:id', (req: AuthenticatedRequest, res: Response) => {
  const { company_id, id } = req.params;
  const deleted = db.deleteItem(company_id, id);
  if (!deleted) {
    res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Item not found' } });
    return;
  }
  res.status(200).json({ success: true, message: 'Item removed from catalog' });
});

export default router;


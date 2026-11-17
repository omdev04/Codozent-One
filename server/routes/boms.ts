import { Router, Response } from 'express';
import { z } from 'zod';
import { db } from '../db/store';
import { AuthenticatedRequest } from '../middleware/auth';
import { BillOfMaterials } from '../../src/types/erp';

const router = Router({ mergeParams: true });

const bomItemSchema = z.object({
  rawItemId: z.string(),
  quantityRequired: z.number().positive(),
  scrapAllowancePercent: z.number().default(2)
});

const bomSchema = z.object({
  productId: z.string(),
  productCode: z.string(),
  productName: z.string(),
  revision: z.string().default('Rev 1.0'),
  batchSize: z.number().default(1),
  items: z.array(bomItemSchema),
  operations: z.array(z.any()).default([])
});

// GET /api/companies/:company_id/boms
router.get('/', (req: AuthenticatedRequest, res: Response) => {
  const companyId = req.params.company_id;
  const boms = db.getBOMs(companyId);
  res.status(200).json({ success: true, data: boms });
});

// GET /api/companies/:company_id/boms/:id
router.get('/:id', (req: AuthenticatedRequest, res: Response) => {
  const { company_id, id } = req.params;
  const bom = db.getBOM(company_id, id);
  if (!bom) {
    res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'BOM not found' } });
    return;
  }
  res.status(200).json({ success: true, data: bom });
});

// POST /api/companies/:company_id/boms
router.post('/', (req: AuthenticatedRequest, res: Response) => {
  const companyId = req.params.company_id;
  const result = bomSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'Invalid BOM structure', details: result.error.errors }
    });
    return;
  }

  const bomNumber = db.getNextSequence(companyId, 'BOM', 'bom');

  // Enrich BOM items with current standard costs from item catalog
  let totalMaterialCost = 0;
  const enrichedItems = result.data.items.map(it => {
    const raw = db.getItem(companyId, it.rawItemId);
    const unitCost = raw ? raw.standardCost : 0;
    const subtotal = it.quantityRequired * unitCost;
    totalMaterialCost += subtotal;

    return {
      id: `bom-item-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      bomId: '',
      rawItemId: it.rawItemId,
      rawItemCode: raw ? raw.itemCode : '',
      rawItemName: raw ? raw.name : '',
      quantityRequired: it.quantityRequired,
      uom: raw ? raw.uom : 'nos',
      scrapAllowancePercent: it.scrapAllowancePercent,
      unitCost,
      subtotalCost: subtotal
    };
  });

  const bom: BillOfMaterials = {
    id: `bom-${Date.now().toString(36)}`,
    companyId,
    bomNumber,
    productId: result.data.productId,
    productCode: result.data.productCode,
    productName: result.data.productName,
    revision: result.data.revision,
    isActive: true,
    batchSize: result.data.batchSize,
    totalMaterialCost,
    items: enrichedItems,
    operations: result.data.operations,
    createdAt: new Date().toISOString()
  };

  db.addBOM(bom);
  res.status(201).json({ success: true, data: bom });
});

export default router;


import { Router, Response } from 'express';
import { db } from '../db/store';
import { AuthenticatedRequest } from '../middleware/auth';
import { StockTransaction } from '../../src/types/erp';

const router = Router({ mergeParams: true });

// GET /api/companies/:company_id/stock-transactions
router.get('/stock-transactions', (req: AuthenticatedRequest, res: Response) => {
  const companyId = req.params.company_id;
  const txs = db.getStockTransactions(companyId);
  res.status(200).json({ success: true, data: txs });
});

// GET /api/companies/:company_id/warehouses
router.get('/warehouses', (req: AuthenticatedRequest, res: Response) => {
  const companyId = req.params.company_id;
  const whs = db.getWarehouses(companyId);
  res.status(200).json({ success: true, data: whs });
});

// GET /api/companies/:company_id/stock-balances
router.get('/stock-balances', (req: AuthenticatedRequest, res: Response) => {
  const companyId = req.params.company_id;
  const items = db.getItems(companyId);

  const balances = items.map(item => ({
    itemId: item.id,
    itemCode: item.itemCode,
    name: item.name,
    category: item.category,
    currentStock: item.currentStock,
    allocatedStock: item.allocatedStock,
    availableStock: Math.max(0, item.currentStock - item.allocatedStock),
    uom: item.uom,
    standardCost: item.standardCost,
    totalValuation: item.currentStock * item.standardCost,
    reorderLevel: item.reorderLevel,
    isLowStock: item.currentStock <= item.reorderLevel
  }));

  res.status(200).json({ success: true, data: balances });
});

// POST /api/companies/:company_id/stock-adjustment
router.post('/stock-adjustment', (req: AuthenticatedRequest, res: Response) => {
  const companyId = req.params.company_id;
  const { itemId, warehouseId, physicalCount, reason } = req.body;

  const item = db.getItem(companyId, itemId);
  if (!item) {
    res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Item not found' } });
    return;
  }

  const current = item.currentStock || 0;
  const delta = physicalCount - current;

  if (delta === 0) {
    res.status(200).json({ success: true, message: 'Stock already reconciles with physical count', data: item });
    return;
  }

  const transactionType = delta > 0 ? 'audit_adjustment_pos' : 'audit_adjustment_neg';
  const qty = Math.abs(delta);

  const tx: StockTransaction = {
    id: `st-adj-${Date.now()}`,
    companyId,
    itemId: item.id,
    itemCode: item.itemCode,
    itemName: item.name,
    warehouseId: warehouseId || item.warehouseId || 'wh-main-01',
    transactionType,
    quantity: qty,
    uom: item.uom,
    unitRate: item.standardCost,
    totalValue: qty * item.standardCost,
    referenceType: 'audit_adjustment',
    referenceId: `AUDIT-${new Date().toISOString().split('T')[0]}`,
    notes: reason || 'Physical count reconciliation',
    createdAt: new Date().toISOString()
  };

  db.addStockTransaction(tx);
  res.status(201).json({ success: true, data: tx, updatedStock: db.getItem(companyId, itemId)?.currentStock });
});

export default router;


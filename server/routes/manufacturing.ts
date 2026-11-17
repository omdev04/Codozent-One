import { Router, Response } from 'express';
import { db } from '../db/store';
import { AuthenticatedRequest } from '../middleware/auth';
import { WorkOrder, ProductionEntry } from '../../src/types/erp';

const router = Router({ mergeParams: true });

// GET /api/companies/:company_id/work-orders
router.get('/work-orders', (req: AuthenticatedRequest, res: Response) => {
  const companyId = req.params.company_id;
  const wos = db.getWorkOrders(companyId);
  res.status(200).json({ success: true, data: wos });
});

// POST /api/companies/:company_id/work-orders
router.post('/work-orders', (req: AuthenticatedRequest, res: Response) => {
  const companyId = req.params.company_id;
  const { productId, bomId, quantity, priority, dueDate, salesOrderId } = req.body;

  const product = db.getItem(companyId, productId);
  const bom = db.getBOM(companyId, bomId);

  if (!product || !bom) {
    res.status(400).json({ success: false, error: { code: 'INVALID_INPUT', message: 'Valid finished product and active BOM required' } });
    return;
  }

  const woNumber = db.getNextSequence(companyId, 'WO', 'work_order');

  const operations = bom.operations && bom.operations.length > 0 ? bom.operations.map((op, idx) => ({
    id: `rt-${Date.now()}-${idx}`,
    workOrderId: '',
    sequence: op.sequenceNumber,
    operationName: op.operationName,
    machineWorkstation: op.workstation,
    cycleTimeMinutes: op.cycleTimeMinutes,
    status: (idx === 0 ? 'pending' : 'pending') as any,
    completedQuantity: 0,
    rejectedQuantity: 0
  })) : [
    {
      id: `rt-${Date.now()}-1`,
      workOrderId: '',
      sequence: 1,
      operationName: 'CNC Machining / Cutting',
      machineWorkstation: 'CNC-Chakan-01',
      cycleTimeMinutes: 12,
      status: 'pending' as any,
      completedQuantity: 0,
      rejectedQuantity: 0
    },
    {
      id: `rt-${Date.now()}-2`,
      workOrderId: '',
      sequence: 2,
      operationName: 'Inspection & Deburring',
      machineWorkstation: 'Bench-03',
      cycleTimeMinutes: 5,
      status: 'pending' as any,
      completedQuantity: 0,
      rejectedQuantity: 0
    }
  ];

  const workOrder: WorkOrder = {
    id: `wo-${Date.now().toString(36)}`,
    companyId,
    woNumber,
    salesOrderId,
    productId,
    productCode: product.itemCode,
    productName: product.name,
    bomId,
    bomRevision: bom.revision,
    plannedQuantity: quantity,
    completedQuantity: 0,
    rejectedQuantity: 0,
    reworkQuantity: 0,
    status: 'scheduled',
    priority: priority || 'normal',
    targetStartDate: new Date().toISOString().split('T')[0],
    targetCompletionDate: dueDate || new Date(Date.now() + 5 * 86400000).toISOString().split('T')[0],
    batchNumber: `BAT-${Date.now().toString(36).toUpperCase()}`,
    materialsIssued: false,
    routing: operations,
    notes: `Production run planned for ${product.name}`
  };

  db.addWorkOrder(workOrder);
  res.status(201).json({ success: true, data: workOrder });
});

// POST /api/companies/:company_id/work-orders/:id/start-job
router.post('/work-orders/:id/start-job', (req: AuthenticatedRequest, res: Response) => {
  const { company_id, id } = req.params;
  const wo = db.getWorkOrder(company_id, id);

  if (!wo) {
    res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Work order not found' } });
    return;
  }

  // Material Issue Lock: check and deduct required raw materials from stock
  const bom = db.getBOM(company_id, wo.bomId);
  if (bom && !wo.materialsIssued) {
    let hasShortage = false;
    let shortageItem = '';

    bom.items.forEach(bomItem => {
      const raw = db.getItem(company_id, bomItem.rawItemId);
      const needed = bomItem.quantityRequired * wo.plannedQuantity;
      if (!raw || raw.currentStock < needed) {
        hasShortage = true;
        shortageItem = raw ? raw.name : 'Unknown Raw Material';
      }
    });

    if (hasShortage) {
      res.status(400).json({
        success: false,
        error: {
          code: 'STOCK_LOCK_SHORTAGE',
          message: `Cannot start Work Order. Material shortage on: ${shortageItem}`
        }
      });
      return;
    }

    // Deduct stock for issued raw materials
    bom.items.forEach(bomItem => {
      const raw = db.getItem(company_id, bomItem.rawItemId);
      const needed = bomItem.quantityRequired * wo.plannedQuantity;
      if (raw) {
        db.addStockTransaction({
          id: `st-issue-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          companyId,
          itemId: raw.id,
          itemCode: raw.itemCode,
          itemName: raw.name,
          warehouseId: raw.warehouseId || 'wh-main-01',
          transactionType: 'issue_production',
          quantity: needed,
          uom: raw.uom,
          unitRate: raw.standardCost,
          totalValue: needed * raw.standardCost,
          referenceType: 'work_order',
          referenceId: wo.woNumber,
          notes: `Material issued for production run ${wo.woNumber}`,
          createdAt: new Date().toISOString()
        });
      }
    });
  }

  const updated = db.updateWorkOrder(company_id, id, {
    status: 'in_progress',
    materialsIssued: true,
    actualStartDate: new Date().toISOString()
  });

  res.status(200).json({ success: true, message: 'Work order started successfully', data: updated });
});

// POST /api/companies/:company_id/work-orders/:id/production-entries
router.post('/work-orders/:id/production-entries', (req: AuthenticatedRequest, res: Response) => {
  const { company_id, id } = req.params;
  const { station, goodQty, rejectedQty, reworkQty, rejectionReason, remarks } = req.body;

  const wo = db.getWorkOrder(company_id, id);
  if (!wo) {
    res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Work order not found' } });
    return;
  }

  const entry: ProductionEntry = {
    id: `pe-${Date.now().toString(36)}`,
    companyId,
    workOrderId: wo.id,
    woNumber: wo.woNumber,
    operationName: station || 'Machining & Assembly',
    machineId: 'CNC-Chakan-01',
    operatorName: req.user ? req.user.name : 'Machinist Team',
    entryDate: new Date().toISOString().split('T')[0],
    shift: 'Shift A (07:00 - 15:30)',
    goodQuantity: goodQty || 0,
    rejectedQuantity: rejectedQty || 0,
    reworkQuantity: reworkQty || 0,
    rejectionReason: rejectionReason || '',
    remarks: remarks || ''
  };

  db.addProductionEntry(entry);

  const newCompleted = (wo.completedQuantity || 0) + (goodQty || 0);
  const newRejected = (wo.rejectedQuantity || 0) + (rejectedQty || 0);
  const newRework = (wo.reworkQuantity || 0) + (reworkQty || 0);

  const isFullyCompleted = newCompleted >= wo.plannedQuantity;

  db.updateWorkOrder(company_id, wo.id, {
    completedQuantity: newCompleted,
    rejectedQuantity: newRejected,
    reworkQuantity: newRework,
    status: isFullyCompleted ? 'completed' : 'in_progress'
  });

  // If completed, add receipt of Finished Goods into FG warehouse
  if (goodQty > 0) {
    const product = db.getItem(company_id, wo.productId);
    if (product) {
      db.addStockTransaction({
        id: `st-fg-${Date.now()}`,
        companyId,
        itemId: product.id,
        itemCode: product.itemCode,
        itemName: product.name,
        warehouseId: 'wh-fg-01',
        transactionType: 'production_receipt',
        quantity: goodQty,
        uom: product.uom,
        unitRate: product.standardCost,
        totalValue: goodQty * product.standardCost,
        referenceType: 'work_order',
        referenceId: wo.woNumber,
        batchNo: wo.batchNumber,
        notes: `Production output logged from ${wo.woNumber}`,
        createdAt: new Date().toISOString()
      });
    }
  }

  res.status(201).json({ success: true, data: entry });
});

// -----------------------------------------------------------------------------
// Work Centres & Machines Master (Test Case E-005)
// -----------------------------------------------------------------------------
router.get('/work-centers', (req: AuthenticatedRequest, res: Response) => {
  const companyId = req.params.company_id;
  const list = db.getWorkCenters(companyId);
  res.status(200).json({ success: true, data: list });
});

router.post('/work-centers', (req: AuthenticatedRequest, res: Response) => {
  const companyId = req.params.company_id;
  const { code, name, hourlyRate, capacityHoursPerDay, location, status } = req.body;

  if (!name || hourlyRate === undefined) {
    res.status(400).json({ success: false, error: { code: 'INVALID_INPUT', message: 'Name and hourly machine rate required' } });
    return;
  }

  const workCenter = db.addWorkCenter({
    id: `wc-${Date.now().toString(36)}`,
    companyId,
    code: code || `WC-${Date.now().toString(36).toUpperCase()}`,
    name,
    hourlyRate: Number(hourlyRate) || 0,
    capacityHoursPerDay: Number(capacityHoursPerDay) || 16,
    location: location || 'Shop Floor',
    status: status || 'active',
    qrCode: `QR-${code || name}-${companyId}`
  });

  res.status(201).json({ success: true, data: workCenter });
});

router.put('/work-centers/:id', (req: AuthenticatedRequest, res: Response) => {
  const { company_id, id } = req.params;
  const updated = db.updateWorkCenter(company_id, id, req.body);
  if (!updated) {
    res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Work centre not found' } });
    return;
  }
  res.status(200).json({ success: true, data: updated });
});

router.delete('/work-centers/:id', (req: AuthenticatedRequest, res: Response) => {
  const { company_id, id } = req.params;
  const deleted = db.deleteWorkCenter(company_id, id);
  if (!deleted) {
    res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Work centre not found' } });
    return;
  }
  res.status(200).json({ success: true, data: { id } });
});

// -----------------------------------------------------------------------------
// What to Buy (Material Shortage Analysis - Test Case E-018)
// -----------------------------------------------------------------------------
router.get('/what-to-buy', (req: AuthenticatedRequest, res: Response) => {
  const companyId = req.params.company_id;
  const items = db.getItems(companyId);
  const wos = db.getWorkOrders(companyId).filter(w => ['scheduled', 'in_progress'].includes(w.status));
  const boms = db.getBOMs(companyId);
  const pos = db.getPurchaseOrders(companyId).filter(p => ['ordered', 'partially_received'].includes(p.status));

  // Tally gross required by itemId
  const requiredMap: Record<string, number> = {};
  wos.forEach(wo => {
    const bom = boms.find(b => b.id === wo.bomId);
    if (bom && bom.items) {
      bom.items.forEach(bi => {
        const qtyPerUnit = bi.quantityRequired || 1;
        const scrapMult = 1 + ((bi.scrapPercentage || 0) / 100);
        const needed = wo.plannedQuantity * qtyPerUnit * scrapMult;
        requiredMap[bi.itemId] = (requiredMap[bi.itemId] || 0) + needed;
      });
    }
  });

  // Tally on-order quantity from pending POs
  const onOrderMap: Record<string, number> = {};
  pos.forEach(po => {
    po.items.forEach(pi => {
      const remaining = pi.quantity - pi.receivedQuantity;
      if (remaining > 0) {
        onOrderMap[pi.itemId] = (onOrderMap[pi.itemId] || 0) + remaining;
      }
    });
  });

  // Calculate shortage list
  const shortages = items
    .filter(itm => itm.category === 'raw_material')
    .map(itm => {
      const grossNeeded = Math.ceil(requiredMap[itm.id] || 0);
      const onHand = itm.currentStock || 0;
      const onOrder = onOrderMap[itm.id] || 0;
      const effectiveStock = onHand + onOrder;
      const shortfall = Math.max(0, grossNeeded - effectiveStock);
      const suggestedQty = Math.max(shortfall, itm.reorderQuantity || 50);
      
      const buyByDays = 3; // urgent based on lead time
      const buyByDate = new Date(Date.now() + buyByDays * 86400000).toISOString().split('T')[0];

      return {
        itemId: itm.id,
        itemCode: itm.itemCode,
        itemName: itm.name,
        uom: itm.uom,
        grossNeeded,
        onHand,
        onOrder,
        shortfall,
        suggestedQty,
        buyByDate,
        isUrgent: shortfall > 0 || onHand <= itm.reorderLevel
      };
    })
    .filter(s => s.grossNeeded > 0 || s.onHand <= 50 || s.shortfall > 0);

  res.status(200).json({ success: true, data: shortages });
});

export default router;


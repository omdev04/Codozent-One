import { Router, Response } from 'express';
import { db } from '../db/store';
import { AuthenticatedRequest } from '../middleware/auth';
import { PurchaseOrder, GoodsReceiptNote, MRPRequirement, PurchaseRequisition, VendorQuotation, PurchaseBill } from '../../src/types/erp';

const router = Router({ mergeParams: true });

// -----------------------------------------------------------------------------
// Purchase Dashboard (KPIs & Real-time Metrics)
// -----------------------------------------------------------------------------
router.get('/purchase-dashboard', (req: AuthenticatedRequest, res: Response) => {
  try {
    const companyId = req.params.company_id;
    const pos = db.getPurchaseOrders(companyId);
    const prs = db.getPurchaseRequisitions(companyId);
    const bills = db.getPurchaseBills(companyId);

    const totalOrders = pos.length;
    const draft = pos.filter(p => p.status === 'draft').length;
    const pendingApprovals = prs.filter(p => p.status === 'pending_approval' || p.status === 'submitted').length;
    const confirmed = pos.filter(p => p.status === 'ordered' || p.status === 'confirmed_by_vendor').length;
    const partiallyReceived = pos.filter(p => p.status === 'partially_received').length;
    const fullyReceived = pos.filter(p => p.status === 'fully_received' || p.status === 'received').length;
    const totalValue = pos.filter(p => p.status !== 'cancelled').reduce((sum, p) => sum + (p.grandTotal || 0), 0);
    const pendingSupplierBills = bills.filter(b => b.paymentStatus === 'unpaid').reduce((sum, b) => sum + (b.totalAmount || 0), 0);

    const overdueDeliveries = pos.filter(p => {
      if (['received', 'fully_received', 'cancelled', 'closed'].includes(p.status)) return false;
      return new Date(p.expectedDate).getTime() < Date.now();
    }).length;

    const recentOrders = [...pos].sort((a, b) => new Date(b.createdAt || b.orderDate).getTime() - new Date(a.createdAt || a.orderDate).getTime()).slice(0, 5);
    const pendingRequisitions = prs.filter(p => ['submitted', 'pending_approval'].includes(p.status)).slice(0, 5);

    res.status(200).json({
      success: true,
      data: {
        totalOrders,
        draft,
        pendingApprovals,
        confirmed,
        partiallyReceived,
        fullyReceived,
        overdueDeliveries,
        totalValue,
        pendingSupplierBills,
        recentOrders,
        pendingRequisitions
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
});

// -----------------------------------------------------------------------------
// Purchase Requisitions (PR)
// -----------------------------------------------------------------------------
router.get('/requisitions', (req: AuthenticatedRequest, res: Response) => {
  try {
    const companyId = req.params.company_id;
    const prs = db.getPurchaseRequisitions(companyId);
    res.status(200).json({ success: true, data: prs });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
});

router.post('/requisitions', (req: AuthenticatedRequest, res: Response) => {
  try {
    const companyId = req.params.company_id;
    const user = { name: (req as any).user?.name || 'Plant Buyer' };
    const { items, purpose } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, error: { code: 'INVALID_INPUT', message: 'At least one line item is required' } });
    }

    const pr = db.createPurchaseRequisition(companyId, req.body, user);
    res.status(201).json({ success: true, data: pr });
  } catch (err: any) {
    res.status(400).json({ success: false, error: { message: err.message } });
  }
});

router.put('/requisitions/:id/status', (req: AuthenticatedRequest, res: Response) => {
  try {
    const { company_id, id } = req.params;
    const user = { name: (req as any).user?.name || 'Plant Manager' };
    const { status, remarks } = req.body;

    if (!status) {
      return res.status(400).json({ success: false, error: { message: 'Status is required' } });
    }

    const updated = db.updatePurchaseRequisitionStatus(company_id, id, status, user, remarks);
    if (!updated) {
      return res.status(404).json({ success: false, error: { message: 'Requisition not found' } });
    }
    res.status(200).json({ success: true, data: updated });
  } catch (err: any) {
    res.status(400).json({ success: false, error: { message: err.message } });
  }
});

// -----------------------------------------------------------------------------
// Purchase Orders
// -----------------------------------------------------------------------------
router.get('/purchase-orders', (req: AuthenticatedRequest, res: Response) => {
  try {
    const companyId = req.params.company_id;
    const { search, status, supplierId } = req.query;
    let pos = db.getPurchaseOrders(companyId);

    if (search && typeof search === 'string') {
      const q = search.toLowerCase().trim();
      pos = pos.filter(p => 
        p.poNumber.toLowerCase().includes(q) ||
        p.supplierName.toLowerCase().includes(q) ||
        (p.requisitionNumber && p.requisitionNumber.toLowerCase().includes(q)) ||
        (p.rfqNumber && p.rfqNumber.toLowerCase().includes(q))
      );
    }

    if (status && typeof status === 'string' && status !== 'all') {
      pos = pos.filter(p => p.status === status);
    }

    if (supplierId && typeof supplierId === 'string' && supplierId !== 'all') {
      pos = pos.filter(p => p.supplierId === supplierId);
    }

    res.status(200).json({ success: true, data: pos });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
});

router.get('/purchase-orders/:id', (req: AuthenticatedRequest, res: Response) => {
  try {
    const { company_id, id } = req.params;
    const po = db.getPurchaseOrder(company_id, id);
    if (!po) {
      return res.status(404).json({ success: false, error: { message: 'Purchase order not found' } });
    }
    res.status(200).json({ success: true, data: po });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
});

router.post('/purchase-orders', (req: AuthenticatedRequest, res: Response) => {
  try {
    const companyId = req.params.company_id;
    const user = { name: (req as any).user?.name || 'Plant Buyer' };
    const { supplierId, items } = req.body;

    if (!supplierId || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, error: { code: 'INVALID_INPUT', message: 'Supplier and items required' } });
    }

    const po = db.createPurchaseOrderRecord(companyId, req.body, user);
    res.status(201).json({ success: true, data: po });
  } catch (err: any) {
    res.status(400).json({ success: false, error: { message: err.message } });
  }
});

router.put('/purchase-orders/:id/status', (req: AuthenticatedRequest, res: Response) => {
  try {
    const { company_id, id } = req.params;
    const user = { name: (req as any).user?.name || 'Plant Buyer' };
    const { status, reason } = req.body;

    if (!status) {
      return res.status(400).json({ success: false, error: { message: 'Status is required' } });
    }

    const updated = db.updatePurchaseOrderStatus(company_id, id, status, user, reason);
    if (!updated) {
      return res.status(404).json({ success: false, error: { message: 'Purchase order not found' } });
    }
    res.status(200).json({ success: true, data: updated });
  } catch (err: any) {
    res.status(400).json({ success: false, error: { message: err.message } });
  }
});

// -----------------------------------------------------------------------------
// Goods Receipt Note (GRN) & Central Stock Ledger Integration
// -----------------------------------------------------------------------------
router.get('/grns', (req: AuthenticatedRequest, res: Response) => {
  const companyId = req.params.company_id;
  const grns = db.getGRNs(companyId);
  res.status(200).json({ success: true, data: grns });
});

router.post('/purchase-orders/:id/grn', (req: AuthenticatedRequest, res: Response) => {
  try {
    const { company_id, id } = req.params;
    const user = { name: (req as any).user?.name || 'Storekeeper' };
    const grn = db.createGRNRecord(company_id, id, req.body, user);
    res.status(201).json({ success: true, data: grn });
  } catch (err: any) {
    res.status(400).json({ success: false, error: { message: err.message } });
  }
});

// -----------------------------------------------------------------------------
// Purchase Bills (3-Way Matching Integration Ready)
// -----------------------------------------------------------------------------
router.get('/bills', (req: AuthenticatedRequest, res: Response) => {
  try {
    const companyId = req.params.company_id;
    const bills = db.getPurchaseBills(companyId);
    res.status(200).json({ success: true, data: bills });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
});

router.post('/bills', (req: AuthenticatedRequest, res: Response) => {
  try {
    const companyId = req.params.company_id;
    const user = { name: (req as any).user?.name || 'Accounts Desk' };
    const { supplierInvoiceNumber, supplierId, totalAmount } = req.body;

    if (!supplierInvoiceNumber || !supplierId || !totalAmount) {
      return res.status(400).json({ success: false, error: { code: 'INVALID_INPUT', message: 'Invoice number, supplier and amount required' } });
    }

    const bill = db.createPurchaseBillRecord(companyId, req.body, user);
    res.status(201).json({ success: true, data: bill });
  } catch (err: any) {
    res.status(400).json({ success: false, error: { message: err.message } });
  }
});

// -----------------------------------------------------------------------------
// Request for Quotations (RFQ) & Multi-Vendor Comparison (Test Case E-019)
// -----------------------------------------------------------------------------
router.get('/rfqs', (req: AuthenticatedRequest, res: Response) => {
  const companyId = req.params.company_id;
  const rfqs = db.getRFQs(companyId);
  res.status(200).json({ success: true, data: rfqs });
});

router.post('/rfqs', (req: AuthenticatedRequest, res: Response) => {
  const companyId = req.params.company_id;
  const { title, items, supplierIds, dueDate, notes } = req.body;

  if (!title || !items || !Array.isArray(items) || items.length === 0) {
    res.status(400).json({ success: false, error: { code: 'INVALID_INPUT', message: 'Title and items required for RFQ' } });
    return;
  }

  const rfqNumber = db.getNextSequence(companyId, 'RFQ', 'rfq');

  const rfq: any = {
    id: `rfq-${Date.now().toString(36)}`,
    companyId,
    rfqNumber,
    title,
    date: new Date().toISOString().split('T')[0],
    dueDate: dueDate || new Date(Date.now() + 5 * 86400000).toISOString().split('T')[0],
    status: supplierIds && supplierIds.length > 0 ? 'sent' : 'draft',
    items,
    supplierIds: supplierIds || [],
    quotes: [],
    notes: notes || 'Please provide your best commercial rates, freight, and earliest dispatch timeline.'
  };

  db.addRFQ(rfq);
  res.status(201).json({ success: true, data: rfq });
});

router.post('/rfqs/:id/quote', (req: AuthenticatedRequest, res: Response) => {
  const { company_id, id } = req.params;
  const { supplierId, supplierName, unitRate, gstRate, freightAmount, deliveryDays, notes } = req.body;

  const rfq = db.getRFQ(company_id, id);
  if (!rfq) {
    res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'RFQ not found' } });
    return;
  }

  const totalQty = rfq.items.reduce((sum: number, it: any) => sum + (Number(it.quantity) || 1), 0);
  const baseAmount = totalQty * Number(unitRate || 0);
  const tax = baseAmount * ((Number(gstRate) || 18) / 100);
  const freight = Number(freightAmount) || 0;
  const landedCost = baseAmount + tax + freight;

  const quote = {
    id: `quote-${Date.now().toString(36)}`,
    supplierId,
    supplierName,
    unitRate: Number(unitRate) || 0,
    gstRate: Number(gstRate) || 18,
    freightAmount: freight,
    deliveryDays: Number(deliveryDays) || 3,
    totalLandedCost: landedCost,
    notes: notes || ''
  };

  const existingQuotes = rfq.quotes || [];
  const updatedQuotes = [...existingQuotes.filter((q: any) => q.supplierId !== supplierId), quote];

  const updated = db.updateRFQ(company_id, id, {
    quotes: updatedQuotes,
    status: 'quotes_received'
  });

  res.status(201).json({ success: true, data: updated });
});

router.post('/rfqs/:id/award', (req: AuthenticatedRequest, res: Response) => {
  const { company_id, id } = req.params;
  const { quoteId } = req.body;

  const rfq = db.getRFQ(company_id, id);
  if (!rfq) {
    res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'RFQ not found' } });
    return;
  }

  const quote = (rfq.quotes || []).find((q: any) => q.id === quoteId);
  if (!quote) {
    res.status(400).json({ success: false, error: { code: 'NOT_FOUND', message: 'Selected quotation not found in RFQ' } });
    return;
  }

  // Generate Purchase Order automatically from winning quote per Master SOP Phase 7
  const poNumber = db.getNextSequence(company_id, 'PO', 'purchase_order');
  const poItems = rfq.items.map((it: any) => {
    const total = it.quantity * quote.unitRate;
    const tax = total * (quote.gstRate / 100);
    return {
      id: `poi-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      itemId: it.itemId,
      itemCode: it.itemCode,
      itemName: it.itemName,
      quantity: it.quantity,
      unitPrice: quote.unitRate,
      gstRate: quote.gstRate,
      taxAmount: tax,
      totalAmount: total + tax,
      receivedQuantity: 0,
      tolerancePercentage: 5
    };
  });

  const subtotal = poItems.reduce((acc: number, itm: any) => acc + (itm.quantity * itm.unitPrice), 0);
  const taxTotal = subtotal * (quote.gstRate / 100);

  const po = db.addPurchaseOrder({
    id: `po-${Date.now().toString(36)}`,
    companyId: company_id,
    poNumber,
    supplierId: quote.supplierId,
    supplierName: quote.supplierName,
    orderDate: new Date().toISOString().split('T')[0],
    expectedDate: new Date(Date.now() + quote.deliveryDays * 86400000).toISOString().split('T')[0],
    status: 'ordered',
    subtotal,
    cgstAmount: taxTotal / 2,
    sgstAmount: taxTotal / 2,
    igstAmount: 0,
    grandTotal: subtotal + taxTotal + quote.freightAmount,
    items: poItems,
    rfqId: rfq.id,
    rfqNumber: rfq.rfqNumber,
    tolerancePercentage: 5,
    notes: `Awarded against ${rfq.rfqNumber}. Freight: ₹${quote.freightAmount}. Expected lead time: ${quote.deliveryDays} days.`
  });

  // Mark RFQ awarded
  const markedQuotes = (rfq.quotes || []).map((q: any) => ({
    ...q,
    isWinningQuote: q.id === quoteId
  }));

  db.updateRFQ(company_id, id, {
    status: 'awarded',
    quotes: markedQuotes,
    awardedPoId: po.id
  });

  res.status(200).json({ success: true, data: { po, rfq } });
});

// -----------------------------------------------------------------------------
// Material Requirement Planning (MRP) Rule-based Engine
// -----------------------------------------------------------------------------
router.get('/mrp', (req: AuthenticatedRequest, res: Response) => {
  const companyId = req.params.company_id;

  const salesOrders = db.getSalesOrders(companyId);
  const items = db.getItems(companyId);
  const boms = db.getBOMs(companyId);
  const purchaseOrders = db.getPurchaseOrders(companyId);

  // Filter open sales orders requiring production
  const openSOs = salesOrders.filter(so => ['confirmed', 'in_production'].includes(so.status));

  // Map to accumulate required quantities for each raw material
  const grossRequirements: Record<string, number> = {};

  openSOs.forEach(so => {
    so.items.forEach(soItem => {
      // Find active BOM for this finished product
      const bom = boms.find(b => b.productId === soItem.itemId && b.isActive);
      if (bom) {
        bom.items.forEach(bomItem => {
          const qtyNeeded = bomItem.quantityRequired * (soItem.orderedQuantity - soItem.shippedQuantity);
          grossRequirements[bomItem.rawItemId] = (grossRequirements[bomItem.rawItemId] || 0) + qtyNeeded;
        });
      }
    });
  });

  // Calculate pending PO incoming stock for each item
  const openPOs = purchaseOrders.filter(po => ['draft', 'ordered'].includes(po.status));
  const incomingPOStock: Record<string, number> = {};

  openPOs.forEach(po => {
    po.items.forEach(poItem => {
      const pendingQty = Math.max(0, poItem.orderedQuantity - poItem.receivedQuantity);
      incomingPOStock[poItem.itemId] = (incomingPOStock[poItem.itemId] || 0) + pendingQty;
    });
  });

  const mrpResults: MRPRequirement[] = [];

  Object.entries(grossRequirements).forEach(([rawItemId, requiredQty]) => {
    const rawItem = items.find(i => i.id === rawItemId);
    if (!rawItem) return;

    const currentStock = rawItem.currentStock || 0;
    const onOrderQty = incomingPOStock[rawItemId] || 0;
    const netShortage = Math.max(0, requiredQty - currentStock - onOrderQty);

    mrpResults.push({
      itemId: rawItemId,
      itemCode: rawItem.itemCode,
      itemName: rawItem.name,
      currentStock,
      allocatedToWIP: rawItem.allocatedStock || 0,
      onOrderQuantity: onOrderQty,
      grossDemand: requiredQty,
      netShortage,
      suggestedOrderQty: netShortage > 0 ? Math.max(netShortage, rawItem.reorderQuantity || 50) : 0,
      leadTimeDays: 5,
      suggestedVendor: 'Standard Pune Metal Supplier'
    });
  });

  res.status(200).json({ success: true, data: mrpResults });
});

export default router;


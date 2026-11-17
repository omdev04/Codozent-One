import { Router, Response } from 'express';
import { z } from 'zod';
import { db } from '../db/store';
import { AuthenticatedRequest } from '../middleware/auth';
import { SalesOrder, Quotation, DeliveryChallan, Invoice } from '../../src/types/erp';

const router = Router({ mergeParams: true });

// -----------------------------------------------------------------------------
// Quotations (Complete Lifecycle, Revisions, Indian GST & Workflow)
// -----------------------------------------------------------------------------
router.get('/quotations', (req: AuthenticatedRequest, res: Response) => {
  try {
    const companyId = req.params.company_id;
    const { search, status, customerId, page = '1', limit = '50' } = req.query;

    let quotes = db.getQuotations(companyId);

    // Filter by search term
    if (search && typeof search === 'string') {
      const q = search.toLowerCase().trim();
      quotes = quotes.filter(item => 
        item.quotationNumber.toLowerCase().includes(q) ||
        item.customerName.toLowerCase().includes(q) ||
        (item.subject && item.subject.toLowerCase().includes(q)) ||
        (item.referenceNumber && item.referenceNumber.toLowerCase().includes(q)) ||
        (item.leadNumber && item.leadNumber.toLowerCase().includes(q))
      );
    }

    // Filter by status
    if (status && typeof status === 'string' && status !== 'all') {
      quotes = quotes.filter(item => item.status === status);
    }

    // Filter by customer
    if (customerId && typeof customerId === 'string' && customerId !== 'all') {
      quotes = quotes.filter(item => item.customerId === customerId);
    }

    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const limitNum = Math.max(1, parseInt(limit as string, 10) || 50);
    const total = quotes.length;
    const paginated = quotes.slice((pageNum - 1) * limitNum, pageNum * limitNum);

    res.status(200).json({
      success: true,
      data: paginated,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum)
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
});

router.get('/quotations/:id', (req: AuthenticatedRequest, res: Response) => {
  try {
    const { company_id, id } = req.params;
    const quote = db.getQuotation(company_id, id);
    if (!quote) {
      return res.status(404).json({ success: false, error: { message: 'Quotation not found' } });
    }
    res.status(200).json({ success: true, data: quote });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
});

router.post('/quotations', (req: AuthenticatedRequest, res: Response) => {
  try {
    const companyId = req.params.company_id;
    const user = { name: (req as any).user?.name || 'Sales Desk' };
    const { customerName, items } = req.body;

    if (!customerName || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: { code: 'INVALID_INPUT', message: 'Customer name and at least one line item are required' } 
      });
    }

    const newQuotation = db.createQuotationRecord(companyId, req.body, user);
    res.status(201).json({ success: true, data: newQuotation });
  } catch (err: any) {
    res.status(400).json({ success: false, error: { message: err.message } });
  }
});

router.put('/quotations/:id', (req: AuthenticatedRequest, res: Response) => {
  try {
    const { company_id, id } = req.params;
    const user = { name: (req as any).user?.name || 'Sales Desk' };

    const updated = db.updateQuotation(company_id, id, req.body, user);
    if (!updated) {
      return res.status(404).json({ success: false, error: { message: 'Quotation not found' } });
    }
    res.status(200).json({ success: true, data: updated });
  } catch (err: any) {
    res.status(400).json({ success: false, error: { message: err.message } });
  }
});

router.post('/quotations/:id/revisions', (req: AuthenticatedRequest, res: Response) => {
  try {
    const { company_id, id } = req.params;
    const user = { name: (req as any).user?.name || 'Sales Desk' };
    const { reason, updates = {} } = req.body;

    if (!reason || typeof reason !== 'string') {
      return res.status(400).json({ success: false, error: { message: 'Revision reason is required' } });
    }

    const result = db.createQuotationRevision(company_id, id, reason, updates, user);
    res.status(201).json({ success: true, data: result.newQuotation, previous: result.previousQuotation });
  } catch (err: any) {
    res.status(400).json({ success: false, error: { message: err.message } });
  }
});

router.post('/quotations/:id/status', (req: AuthenticatedRequest, res: Response) => {
  try {
    const { company_id, id } = req.params;
    const user = { name: (req as any).user?.name || 'Sales Desk' };
    const { status, reason, comments, sentVia } = req.body;

    if (!status) {
      return res.status(400).json({ success: false, error: { message: 'Status is required' } });
    }

    const updated = db.updateQuotationStatus(company_id, id, status, { reason, comments, sentVia }, user);
    res.status(200).json({ success: true, data: updated });
  } catch (err: any) {
    res.status(400).json({ success: false, error: { message: err.message } });
  }
});

router.post('/quotations/:id/submit-approval', (req: AuthenticatedRequest, res: Response) => {
  try {
    const { company_id, id } = req.params;
    const user = { name: (req as any).user?.name || 'Sales Desk' };
    const updated = db.updateQuotationStatus(company_id, id, 'pending_approval', {}, user);
    res.status(200).json({ success: true, data: updated });
  } catch (err: any) {
    res.status(400).json({ success: false, error: { message: err.message } });
  }
});

router.post('/quotations/:id/approve', (req: AuthenticatedRequest, res: Response) => {
  try {
    const { company_id, id } = req.params;
    const user = { name: (req as any).user?.name || 'Manager' };
    const { comments } = req.body;
    const updated = db.updateQuotationStatus(company_id, id, 'approved', { comments }, user);
    res.status(200).json({ success: true, data: updated });
  } catch (err: any) {
    res.status(400).json({ success: false, error: { message: err.message } });
  }
});

router.post('/quotations/:id/reject', (req: AuthenticatedRequest, res: Response) => {
  try {
    const { company_id, id } = req.params;
    const user = { name: (req as any).user?.name || 'Manager' };
    const { reason } = req.body;
    const updated = db.updateQuotationStatus(company_id, id, 'rejected', { reason: reason || 'Internal rejection' }, user);
    res.status(200).json({ success: true, data: updated });
  } catch (err: any) {
    res.status(400).json({ success: false, error: { message: err.message } });
  }
});

router.post('/quotations/:id/send', (req: AuthenticatedRequest, res: Response) => {
  try {
    const { company_id, id } = req.params;
    const user = { name: (req as any).user?.name || 'Sales Desk' };
    const { sentVia = 'email', comments } = req.body;
    const updated = db.updateQuotationStatus(company_id, id, 'sent', { sentVia, comments }, user);
    res.status(200).json({ success: true, data: updated });
  } catch (err: any) {
    res.status(400).json({ success: false, error: { message: err.message } });
  }
});

router.post('/quotations/:id/customer-response', (req: AuthenticatedRequest, res: Response) => {
  try {
    const { company_id, id } = req.params;
    const user = { name: (req as any).user?.name || 'Sales Desk' };
    const { response, reason, comments } = req.body; // 'accepted', 'rejected', 'revision_requested'

    if (!response || !['accepted', 'rejected', 'revision_requested', 'under_negotiation'].includes(response)) {
      return res.status(400).json({ success: false, error: { message: 'Invalid customer response type' } });
    }

    const updated = db.updateQuotationStatus(company_id, id, response, { reason, comments }, user);
    res.status(200).json({ success: true, data: updated });
  } catch (err: any) {
    res.status(400).json({ success: false, error: { message: err.message } });
  }
});

router.post('/quotations/:id/duplicate', (req: AuthenticatedRequest, res: Response) => {
  try {
    const { company_id, id } = req.params;
    const user = { name: (req as any).user?.name || 'Sales Desk' };
    const duplicated = db.duplicateQuotation(company_id, id, user);
    res.status(201).json({ success: true, data: duplicated });
  } catch (err: any) {
    res.status(400).json({ success: false, error: { message: err.message } });
  }
});

router.post('/quotations/:id/convert-to-order', (req: AuthenticatedRequest, res: Response) => {
  try {
    const { company_id, id } = req.params;
    const user = { name: (req as any).user?.name || 'Sales Desk' };
    const result = db.convertQuotationToSalesOrder(company_id, id, user);
    res.status(200).json({ success: true, data: result });
  } catch (err: any) {
    res.status(400).json({ success: false, error: { message: err.message } });
  }
});

router.post('/quotations/:id/attachments', (req: AuthenticatedRequest, res: Response) => {
  try {
    const { company_id, id } = req.params;
    const user = { name: (req as any).user?.name || 'Sales Desk' };
    const attachment = db.addQuotationAttachment(company_id, id, req.body, user);
    res.status(201).json({ success: true, data: attachment });
  } catch (err: any) {
    res.status(400).json({ success: false, error: { message: err.message } });
  }
});

router.delete('/quotations/:id', (req: AuthenticatedRequest, res: Response) => {
  try {
    const { company_id, id } = req.params;
    const user = { name: (req as any).user?.name || 'Sales Desk' };
    const quote = db.getQuotation(company_id, id);
    if (!quote) {
      return res.status(404).json({ success: false, error: { message: 'Quotation not found' } });
    }
    if (quote.status === 'converted_to_order') {
      return res.status(400).json({ success: false, error: { message: 'Cannot delete a quotation that has already been converted to an active Sales Order' } });
    }
    // Mark as cancelled to preserve history
    const cancelled = db.updateQuotationStatus(company_id, id, 'cancelled', { reason: 'Deleted by user' }, user);
    res.status(200).json({ success: true, data: cancelled });
  } catch (err: any) {
    res.status(400).json({ success: false, error: { message: err.message } });
  }
});

// -----------------------------------------------------------------------------
// Sales Orders (Complete Trade Lifecycle)
// -----------------------------------------------------------------------------
router.get('/sales-orders', (req: AuthenticatedRequest, res: Response) => {
  try {
    const companyId = req.params.company_id;
    const { search, status, customerId } = req.query;
    let orders = db.getSalesOrders(companyId);

    if (search && typeof search === 'string') {
      const q = search.toLowerCase().trim();
      orders = orders.filter(o => 
        o.soNumber.toLowerCase().includes(q) ||
        o.customerName.toLowerCase().includes(q) ||
        (o.customerPoNumber && o.customerPoNumber.toLowerCase().includes(q)) ||
        (o.quotationNumber && o.quotationNumber.toLowerCase().includes(q))
      );
    }

    if (status && typeof status === 'string' && status !== 'all') {
      orders = orders.filter(o => o.status === status);
    }

    if (customerId && typeof customerId === 'string' && customerId !== 'all') {
      orders = orders.filter(o => o.customerId === customerId);
    }

    res.status(200).json({ success: true, data: orders });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
});

router.get('/sales-orders/:id', (req: AuthenticatedRequest, res: Response) => {
  try {
    const { company_id, id } = req.params;
    const order = db.getSalesOrder(company_id, id);
    if (!order) {
      return res.status(404).json({ success: false, error: { message: 'Sales order not found' } });
    }
    res.status(200).json({ success: true, data: order });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
});

router.post('/sales-orders', (req: AuthenticatedRequest, res: Response) => {
  try {
    const companyId = req.params.company_id;
    const user = { name: (req as any).user?.name || 'Sales Desk' };
    const { customerName, items } = req.body;

    if (!customerName || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_INPUT', message: 'Customer name and line items are required' }
      });
    }

    const newOrder = db.createSalesOrderRecord(companyId, req.body, user);
    res.status(201).json({ success: true, data: newOrder });
  } catch (err: any) {
    res.status(400).json({ success: false, error: { message: err.message } });
  }
});

// PUT /api/companies/:company_id/sales-orders/:id
router.put('/sales-orders/:id', (req: AuthenticatedRequest, res: Response) => {
  const { company_id, id } = req.params;
  const updated = db.updateSalesOrder(company_id, id, req.body);
  if (!updated) {
    res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Sales order not found' } });
    return;
  }
  res.status(200).json({ success: true, data: updated });
});

// POST /api/companies/:company_id/sales-orders/:id/status
router.post('/sales-orders/:id/status', (req: AuthenticatedRequest, res: Response) => {
  try {
    const { company_id, id } = req.params;
    const user = { name: (req as any).user?.name || 'Sales Desk' };
    const { status, reason } = req.body;

    if (!status) {
      return res.status(400).json({ success: false, error: { message: 'New status is required' } });
    }

    const updated = db.updateSalesOrderStatus(company_id, id, status, user, reason);
    if (!updated) {
      return res.status(404).json({ success: false, error: { message: 'Sales order not found' } });
    }
    res.status(200).json({ success: true, data: updated });
  } catch (err: any) {
    res.status(400).json({ success: false, error: { message: err.message } });
  }
});

// POST /api/companies/:company_id/sales-orders/:id/cancel
router.post('/sales-orders/:id/cancel', (req: AuthenticatedRequest, res: Response) => {
  try {
    const { company_id, id } = req.params;
    const user = { name: (req as any).user?.name || 'Sales Desk' };
    const { reason } = req.body;

    if (!reason) {
      return res.status(400).json({ success: false, error: { message: 'Cancellation reason is required' } });
    }

    const cancelled = db.cancelSalesOrder(company_id, id, user, reason);
    if (!cancelled) {
      return res.status(404).json({ success: false, error: { message: 'Sales order not found' } });
    }
    res.status(200).json({ success: true, data: cancelled });
  } catch (err: any) {
    res.status(400).json({ success: false, error: { message: err.message } });
  }
});

// GET /api/companies/:company_id/sales-dashboard
router.get('/sales-dashboard', (req: AuthenticatedRequest, res: Response) => {
  try {
    const companyId = req.params.company_id;
    const orders = db.getSalesOrders(companyId);

    const totalOrders = orders.length;
    const draft = orders.filter(o => o.status === 'draft').length;
    const confirmed = orders.filter(o => o.status === 'confirmed').length;
    const inProduction = orders.filter(o => o.status === 'in_production').length;
    const readyForDispatch = orders.filter(o => o.status === 'ready_for_dispatch').length;
    const partiallyDispatched = orders.filter(o => o.status === 'partially_dispatched' || o.status === 'partially_shipped').length;
    const completed = orders.filter(o => o.status === 'completed').length;
    const cancelled = orders.filter(o => o.status === 'cancelled').length;

    const totalValue = orders.filter(o => o.status !== 'cancelled').reduce((sum, o) => sum + (o.grandTotal || 0), 0);
    const pendingDeliveryValue = orders.filter(o => ['confirmed', 'in_production', 'ready_for_dispatch'].includes(o.status))
      .reduce((sum, o) => sum + (o.grandTotal || 0), 0);

    const recentOrders = [...orders].sort((a, b) => new Date(b.createdAt || b.orderDate).getTime() - new Date(a.createdAt || a.orderDate).getTime()).slice(0, 5);

    res.status(200).json({
      success: true,
      data: {
        totalOrders,
        draft,
        confirmed,
        inProduction,
        readyForDispatch,
        partiallyDispatched,
        completed,
        cancelled,
        totalValue,
        pendingDeliveryValue,
        recentOrders
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
});

// -----------------------------------------------------------------------------
// Dispatch & Delivery Challan
// -----------------------------------------------------------------------------
router.get('/challans', (req: AuthenticatedRequest, res: Response) => {
  const companyId = req.params.company_id;
  const challans = db.getDeliveryChallans(companyId);
  res.status(200).json({ success: true, data: challans });
});

router.post('/sales-orders/:id/dispatch', (req: AuthenticatedRequest, res: Response) => {
  const { company_id, id } = req.params;
  const { transporter, vehicleNo, eWayBill } = req.body;

  const so = db.getSalesOrder(company_id, id);
  if (!so) {
    res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Sales order not found' } });
    return;
  }

  const challanNumber = db.getNextSequence(company_id, 'DC', 'delivery_challan');

  const challanItems = so.items.map(it => {
    // Log outbound stock movement for dispatched goods
    db.addStockTransaction({
      id: `st-dispatch-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      companyId: company_id,
      itemId: it.itemId,
      itemCode: it.itemCode,
      itemName: it.itemName,
      warehouseId: 'wh-fg-01',
      transactionType: 'dispatch_sales',
      quantity: it.orderedQuantity,
      uom: it.uom,
      unitRate: it.unitPrice,
      totalValue: it.orderedQuantity * it.unitPrice,
      referenceType: 'dispatch_challan',
      referenceId: challanNumber,
      notes: `Dispatched against ${so.soNumber} to ${so.customerName}`,
      createdAt: new Date().toISOString()
    });

    return {
      id: `dc-item-${Date.now()}`,
      challanId: '',
      itemId: it.itemId,
      itemCode: it.itemCode,
      itemName: it.itemName,
      quantityDispatched: it.orderedQuantity,
      uom: it.uom
    };
  });

  const challan: DeliveryChallan = {
    id: `dc-${Date.now().toString(36)}`,
    companyId: company_id,
    challanNumber,
    salesOrderId: so.id,
    soNumber: so.soNumber,
    customerId: so.customerId,
    customerName: so.customerName,
    dispatchDate: new Date().toISOString().split('T')[0],
    transporterName: transporter || 'VRL Logistics Chakan',
    vehicleNumber: vehicleNo || 'MH-14-GH-4412',
    eWayBillNumber: eWayBill || `EWB-${Math.floor(100000000000 + Math.random() * 900000000000)}`,
    status: 'dispatched',
    items: challanItems
  };

  db.addDeliveryChallan(challan);
  db.updateSalesOrder(company_id, so.id, { status: 'shipped' });

  res.status(201).json({ success: true, data: challan });
});

// -----------------------------------------------------------------------------
// Proforma & Advance Payment (Test Case E-016 / Master SOP Phase 1 & 2)
// -----------------------------------------------------------------------------
router.post('/sales-orders/:id/proforma', (req: AuthenticatedRequest, res: Response) => {
  const { company_id, id } = req.params;
  const { advancePercentage } = req.body;
  const so = db.getSalesOrder(company_id, id);

  if (!so) {
    res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Sales order not found' } });
    return;
  }

  const pct = Number(advancePercentage) || 20; // Default 20% Advance per Master SOP
  const advAmount = Math.round(so.grandTotal * (pct / 100));
  const proformaNumber = db.getNextSequence(company_id, 'PI', 'proforma');

  const updated = db.updateSalesOrder(company_id, id, {
    advancePercentage: pct,
    advanceAmount: advAmount,
    proformaNumber,
    notes: `${so.notes ? so.notes + ' | ' : ''}Proforma ${proformaNumber} raised for ${pct}% advance (₹${advAmount.toLocaleString('en-IN')})`
  });

  res.status(200).json({ success: true, data: updated });
});

router.post('/sales-orders/:id/advance-payment', (req: AuthenticatedRequest, res: Response) => {
  const { company_id, id } = req.params;
  const { amount, utrRef, paymentMode } = req.body;
  const so = db.getSalesOrder(company_id, id);

  if (!so) {
    res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Sales order not found' } });
    return;
  }

  const advPaid = Number(amount) || so.advanceAmount || Math.round(so.grandTotal * 0.20);
  const utr = utrRef || `UTR-${Date.now().toString(36).toUpperCase()}`;

  const updated = db.updateSalesOrder(company_id, id, {
    advancePaid: true,
    advanceAmount: advPaid,
    advanceUtrRef: utr,
    workReleased: true,
    status: 'in_production'
  });

  // Post Double-Entry Accounting: Bank Dr, Customer Advance Cr (Liability)
  db.addLedgerEntry({
    id: `gle-adv-${Date.now()}-dr`,
    companyId: company_id,
    entryDate: new Date().toISOString().split('T')[0],
    accountCode: '1000',
    accountName: 'Bank & Cash Balances',
    debitAmount: advPaid,
    creditAmount: 0,
    narration: `Advance payment received for SO ${so.soNumber} via ${paymentMode || 'UPI/NEFT'} Ref: ${utr}`,
    referenceType: 'advance_receipt',
    referenceId: so.soNumber
  });

  db.addLedgerEntry({
    id: `gle-adv-${Date.now()}-cr`,
    companyId: company_id,
    entryDate: new Date().toISOString().split('T')[0],
    accountCode: '2050',
    accountName: 'Customer Advance Deposit (Current Liability)',
    debitAmount: 0,
    creditAmount: advPaid,
    narration: `Customer advance deposit against SO ${so.soNumber}`,
    referenceType: 'advance_receipt',
    referenceId: so.soNumber
  });

  res.status(200).json({ success: true, data: updated });
});

// -----------------------------------------------------------------------------
// Invoicing & Final Tax Invoice Reconciliation (Master SOP Phase 10)
// -----------------------------------------------------------------------------
router.get('/invoices', (req: AuthenticatedRequest, res: Response) => {
  const companyId = req.params.company_id;
  const invoices = db.getInvoices(companyId);
  res.status(200).json({ success: true, data: invoices });
});

router.post('/sales-orders/:id/invoice', (req: AuthenticatedRequest, res: Response) => {
  const { company_id, id } = req.params;
  const so = db.getSalesOrder(company_id, id);

  if (!so) {
    res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Sales order not found' } });
    return;
  }

  const invoiceNumber = db.getNextSequence(company_id, 'INV', 'sales_invoice');

  const invoiceItems = so.items.map(it => ({
    id: `inv-item-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    invoiceId: '',
    itemId: it.itemId,
    itemCode: it.itemCode,
    itemName: it.itemName,
    quantity: it.orderedQuantity,
    uom: it.uom,
    unitPrice: it.unitPrice,
    hsnSacCode: it.hsnSacCode,
    gstRate: it.gstRate,
    cgstAmount: it.subtotal * (it.gstRate / 200),
    sgstAmount: it.subtotal * (it.gstRate / 200),
    igstAmount: 0,
    totalAmount: it.subtotal * (1 + it.gstRate / 100)
  }));

  // Auto-deduct Advance Payment if previously recorded per SOP Phase 10
  const advanceDeducted = (so.advancePaid && so.advanceAmount) ? so.advanceAmount : 0;
  const netBalanceDue = Math.max(0, so.grandTotal - advanceDeducted);

  const invoice: Invoice = {
    id: `inv-${Date.now().toString(36)}`,
    companyId: company_id,
    invoiceNumber,
    salesOrderId: so.id,
    soNumber: so.soNumber,
    customerId: so.customerId,
    customerName: so.customerName,
    invoiceDate: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
    status: netBalanceDue === 0 ? 'paid' : (advanceDeducted > 0 ? 'partially_paid' : 'unpaid'),
    subtotal: so.subtotal,
    cgstAmount: so.cgstAmount,
    sgstAmount: so.sgstAmount,
    igstAmount: so.igstAmount,
    grandTotal: so.grandTotal,
    paidAmount: advanceDeducted,
    balanceAmount: netBalanceDue,
    advanceDeducted,
    irnNumber: `IRN-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
    eWayBillNumber: `EWB-${Math.floor(100000000000 + Math.random() * 900000000000)}`,
    items: invoiceItems
  };

  db.addInvoice(invoice);
  db.updateSalesOrder(company_id, so.id, { status: 'completed' });

  // Post Double-Entry Accounting to General Ledger
  db.addLedgerEntry({
    id: `gle-${Date.now()}-dr`,
    companyId: company_id,
    entryDate: invoice.invoiceDate,
    accountCode: '1100',
    accountName: 'Trade Receivables (Sundry Debtors)',
    debitAmount: netBalanceDue,
    creditAmount: 0,
    narration: `Net balance receivable for Sales Invoice ${invoice.invoiceNumber} (Advance ₹${advanceDeducted} adjusted)`,
    referenceType: 'sales_invoice',
    referenceId: invoice.invoiceNumber
  });

  if (advanceDeducted > 0) {
    db.addLedgerEntry({
      id: `gle-${Date.now()}-adv-dr`,
      companyId: company_id,
      entryDate: invoice.invoiceDate,
      accountCode: '2050',
      accountName: 'Customer Advance Deposit (Current Liability)',
      debitAmount: advanceDeducted,
      creditAmount: 0,
      narration: `Advance liability cleared against final tax invoice ${invoice.invoiceNumber}`,
      referenceType: 'sales_invoice',
      referenceId: invoice.invoiceNumber
    });
  }

  db.addLedgerEntry({
    id: `gle-${Date.now()}-cr`,
    companyId: company_id,
    entryDate: invoice.invoiceDate,
    accountCode: '3000',
    accountName: 'Sales Revenue (Manufacturing Output)',
    debitAmount: 0,
    creditAmount: invoice.subtotal,
    narration: `Sales revenue for ${invoice.invoiceNumber}`,
    referenceType: 'sales_invoice',
    referenceId: invoice.invoiceNumber
  });

  res.status(201).json({ success: true, data: invoice });
});

export default router;


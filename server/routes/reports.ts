import { Router, Response } from 'express';
import { db } from '../db/store';
import { AuthenticatedRequest } from '../middleware/auth';

const router = Router({ mergeParams: true });

// GET /api/companies/:company_id/reports/production
router.get('/reports/production', (req: AuthenticatedRequest, res: Response) => {
  const companyId = req.params.company_id;
  const entries = db.getProductionEntries(companyId);
  const wos = db.getWorkOrders(companyId);

  const totalGood = entries.reduce((acc, e) => acc + (e.goodQuantity || 0), 0);
  const totalRejected = entries.reduce((acc, e) => acc + (e.rejectedQuantity || 0), 0);
  const totalRework = entries.reduce((acc, e) => acc + (e.reworkQuantity || 0), 0);

  res.status(200).json({
    success: true,
    data: {
      totalWorkOrders: wos.length,
      activeJobs: wos.filter(w => w.status === 'in_progress').length,
      totalUnitsProduced: totalGood,
      totalRejections: totalRejected,
      totalReworkUnits: totalRework,
      firstPassYield: totalGood + totalRejected > 0 ? ((totalGood / (totalGood + totalRejected)) * 100).toFixed(1) + '%' : '100%',
      entries
    }
  });
});

// GET /api/companies/:company_id/reports/stock-valuation
router.get('/reports/stock-valuation', (req: AuthenticatedRequest, res: Response) => {
  const companyId = req.params.company_id;
  const items = db.getItems(companyId);

  let totalValuation = 0;
  const breakdown = items.map(i => {
    const val = (i.currentStock || 0) * (i.standardCost || 0);
    totalValuation += val;
    return {
      itemId: i.id,
      itemCode: i.itemCode,
      name: i.name,
      category: i.category,
      stock: i.currentStock,
      uom: i.uom,
      unitCost: i.standardCost,
      totalValuation: val
    };
  });

  res.status(200).json({
    success: true,
    data: {
      totalValuation,
      totalSKUs: items.length,
      breakdown
    }
  });
});

// GET /api/companies/:company_id/reports/sales-register
router.get('/reports/sales-register', (req: AuthenticatedRequest, res: Response) => {
  const companyId = req.params.company_id;
  const invoices = db.getInvoices(companyId);

  let totalBilled = 0;
  let totalTax = 0;

  const records = invoices.map(inv => {
    totalBilled += inv.grandTotal;
    totalTax += inv.cgstAmount + inv.sgstAmount + inv.igstAmount;
    return {
      invoiceNumber: inv.invoiceNumber,
      date: inv.invoiceDate,
      customer: inv.customerName,
      taxableAmount: inv.subtotal,
      cgst: inv.cgstAmount,
      sgst: inv.sgstAmount,
      grandTotal: inv.grandTotal,
      status: inv.status
    };
  });

  res.status(200).json({
    success: true,
    data: {
      totalInvoices: invoices.length,
      totalBilled,
      totalTaxCollected: totalTax,
      records
    }
  });
});

export default router;


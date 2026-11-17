import { Router, Request, Response, NextFunction } from 'express';
import { db } from '../db/store';
import { CADeskQuery } from '../../src/types/erp';

const router = Router({ mergeParams: true });

// GET /api/companies/:company_id/ca-desk/queries
router.get('/queries', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { company_id } = req.params;
    const queries = db.getCADeskQueries(company_id);
    res.status(200).json({ success: true, data: queries });
  } catch (err) {
    next(err);
  }
});

// POST /api/companies/:company_id/ca-desk/queries
router.post('/queries', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { company_id } = req.params;
    const { caName, category, subject, details } = req.body;

    if (!subject || !details) {
      return res.status(400).json({ success: false, error: 'Subject and Details are required' });
    }

    const newQuery: CADeskQuery = {
      id: `ca-q-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      companyId: company_id,
      caName: caName || 'Statutory Auditor',
      category: category || 'stock_valuation',
      subject,
      details,
      status: 'open',
      createdAt: new Date().toISOString()
    };

    const created = db.createCADeskQuery(newQuery);
    res.status(201).json({ success: true, data: created });
  } catch (err) {
    next(err);
  }
});

// POST /api/companies/:company_id/ca-desk/queries/:id/answer
router.post('/queries/:id/answer', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { company_id, id } = req.params;
    const { clientResponse } = req.body;

    if (!clientResponse) {
      return res.status(400).json({ success: false, error: 'Response message required' });
    }

    const updated = db.answerCADeskQuery(company_id, id, clientResponse);
    if (!updated) {
      return res.status(404).json({ success: false, error: 'Audit query not found' });
    }
    res.status(200).json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
});

// GET /api/companies/:company_id/ca-desk/msme-scrutiny (Section 43B(h) compliance)
router.get('/msme-scrutiny', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { company_id } = req.params;
    const list = db.getMsmeScrutiny(company_id);
    res.status(200).json({ success: true, data: list });
  } catch (err) {
    next(err);
  }
});

// GET /api/companies/:company_id/ca-desk/schedule-iii
router.get('/schedule-iii', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { company_id } = req.params;
    const coa = db.getChartOfAccounts(company_id);
    const invs = db.getInvoices(company_id);
    const pos = db.getPurchaseOrders(company_id);

    const revenue = invs.reduce((sum, i) => sum + i.subtotal, 0);
    const directExpenses = pos.reduce((sum, p) => sum + p.subtotal, 0);
    const grossProfit = revenue - directExpenses;

    const scheduleIII = {
      financialYear: '2025-26',
      asOfDate: '31st March 2026',
      balanceSheet: {
        equitiesAndLiabilities: [
          { group: 'Shareholder Funds', title: 'Equity Share Capital', amount: 5000000 },
          { group: 'Shareholder Funds', title: 'Reserves & Surplus', amount: Math.max(0, grossProfit * 0.7) },
          { group: 'Current Liabilities', title: 'Trade Payables (Sundry Creditors)', amount: directExpenses },
          { group: 'Current Liabilities', title: 'Statutory GST & Tax Dues', amount: 142000 }
        ],
        assets: [
          { group: 'Non-Current Assets', title: 'Property, Plant & Equipment (Gross)', amount: 4200000 },
          { group: 'Current Assets', title: 'Inventories (Raw Material + Finished Goods)', amount: 1850000 },
          { group: 'Current Assets', title: 'Trade Receivables (Sundry Debtors)', amount: revenue },
          { group: 'Current Assets', title: 'Cash & Cash Equivalents', amount: 1250000 }
        ]
      },
      profitAndLoss: {
        revenueFromOperations: revenue,
        otherIncome: 45000,
        totalIncome: revenue + 45000,
        costOfMaterialsConsumed: directExpenses,
        employeeBenefitExpenses: 840000,
        depreciationAndAmortisation: 120000,
        otherExpenses: 180000,
        totalExpenses: directExpenses + 840000 + 120000 + 180000,
        profitBeforeTax: revenue + 45000 - (directExpenses + 840000 + 120000 + 180000)
      }
    };

    res.status(200).json({ success: true, data: scheduleIII });
  } catch (err) {
    next(err);
  }
});

export default router;


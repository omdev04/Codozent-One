import { Router, Request, Response, NextFunction } from 'express';
import { db } from '../db/store';
import { CounterSale } from '../../src/types/erp';

const router = Router({ mergeParams: true });

// GET /api/companies/:company_id/counter/sales
router.get('/sales', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { company_id } = req.params;
    const sales = db.getCounterSales(company_id);
    res.status(200).json({ success: true, data: sales });
  } catch (err) {
    next(err);
  }
});

// POST /api/companies/:company_id/counter/checkout
router.post('/checkout', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { company_id } = req.params;
    const { cashierName, customerPhone, paymentMode, items, discountAmount, cashTendered } = req.body;

    if (!items || !items.length) {
      return res.status(400).json({ success: false, error: 'At least one item is required for checkout' });
    }

    const subtotal = items.reduce((sum: number, it: any) => sum + (it.quantity * it.unitPrice), 0);
    const discount = Number(discountAmount) || 0;
    const gstAmount = Math.round((subtotal - discount) * 0.18);
    const totalAmount = subtotal - discount + gstAmount;
    const tendered = Number(cashTendered) || totalAmount;
    const change = Math.max(0, tendered - totalAmount);

    const receiptNumber = `POS-${new Date().getFullYear()}-${String(Date.now()).slice(-5)}`;

    const newSale: CounterSale = {
      id: `sale-${Date.now()}`,
      companyId: company_id,
      receiptNumber,
      timestamp: new Date().toISOString(),
      cashierName: cashierName || 'Counter Cashier',
      customerPhone: customerPhone || '',
      paymentMode: paymentMode || 'cash',
      subtotal,
      discountAmount: discount,
      gstAmount,
      totalAmount,
      cashTendered: tendered,
      changeReturned: change,
      items
    };

    const created = db.createCounterSale(newSale);

    db.logAudit({
      companyId: company_id,
      userName: cashierName || 'Cashier',
      action: 'CREATE',
      entityName: 'CounterSale',
      entityId: created.id,
      details: `Completed counter POS billing ${created.receiptNumber} for ₹${created.totalAmount}`,
      timestamp: new Date().toISOString()
    });

    res.status(201).json({ success: true, data: created });
  } catch (err) {
    next(err);
  }
});

export default router;


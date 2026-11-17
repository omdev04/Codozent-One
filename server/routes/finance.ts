import { Router, Response } from 'express';
import { db } from '../db/store';
import { AuthenticatedRequest } from '../middleware/auth';
import { Payment } from '../../src/types/erp';

const router = Router({ mergeParams: true });

// GET /api/companies/:company_id/chart-of-accounts
router.get('/chart-of-accounts', (req: AuthenticatedRequest, res: Response) => {
  const companyId = req.params.company_id;
  const coa = db.getChartOfAccounts(companyId);
  res.status(200).json({ success: true, data: coa });
});

// GET /api/companies/:company_id/ledger-entries
router.get('/ledger-entries', (req: AuthenticatedRequest, res: Response) => {
  const companyId = req.params.company_id;
  const entries = db.getLedgerEntries(companyId);
  res.status(200).json({ success: true, data: entries });
});

// GET /api/companies/:company_id/payments
router.get('/payments', (req: AuthenticatedRequest, res: Response) => {
  const companyId = req.params.company_id;
  const payments = db.getPayments(companyId);
  res.status(200).json({ success: true, data: payments });
});

// POST /api/companies/:company_id/payments
router.post('/payments', (req: AuthenticatedRequest, res: Response) => {
  const companyId = req.params.company_id;
  const { paymentType, partnerId, partnerName, amount, paymentMode, referenceNumber, invoiceId, notes } = req.body;

  if (!amount || amount <= 0 || !partnerId) {
    res.status(400).json({ success: false, error: { code: 'INVALID_INPUT', message: 'Valid amount and partner required' } });
    return;
  }

  const receiptNumber = db.getNextSequence(companyId, 'RCPT', 'payment');

  const payment: Payment = {
    id: `pay-${Date.now().toString(36)}`,
    companyId,
    receiptNumber,
    paymentType,
    partnerId,
    partnerName,
    paymentDate: new Date().toISOString().split('T')[0],
    amount,
    paymentMode: paymentMode || 'neft',
    referenceNumber: referenceNumber || `TXN-${Math.floor(100000 + Math.random() * 900000)}`,
    invoiceId,
    notes: notes || ''
  };

  db.addPayment(payment);

  // Post Double-Entry Accounting
  if (paymentType === 'customer_receipt') {
    db.addLedgerEntry({
      id: `gle-pay-${Date.now()}-dr`,
      companyId,
      entryDate: payment.paymentDate,
      accountCode: '1000',
      accountName: 'Cash & Bank Balances',
      debitAmount: amount,
      creditAmount: 0,
      narration: `Payment received from ${partnerName} via ${paymentMode.toUpperCase()} (${payment.referenceNumber})`,
      referenceType: 'payment_receipt',
      referenceId: payment.receiptNumber
    });

    db.addLedgerEntry({
      id: `gle-pay-${Date.now()}-cr`,
      companyId,
      entryDate: payment.paymentDate,
      accountCode: '1100',
      accountName: 'Trade Receivables (Sundry Debtors)',
      debitAmount: 0,
      creditAmount: amount,
      narration: `Account credited for payment receipt ${payment.receiptNumber}`,
      referenceType: 'payment_receipt',
      referenceId: payment.receiptNumber
    });
  }

  res.status(201).json({ success: true, data: payment });
});

// GET /api/companies/:company_id/gst-summary
router.get('/gst-summary', (req: AuthenticatedRequest, res: Response) => {
  const companyId = req.params.company_id;
  const invoices = db.getInvoices(companyId);
  const purchaseOrders = db.getPurchaseOrders(companyId);

  // Outward taxable supplies (GSTR-1)
  let totalTaxableSales = 0;
  let outputCGST = 0;
  let outputSGST = 0;
  let outputIGST = 0;

  invoices.forEach(inv => {
    totalTaxableSales += inv.subtotal;
    outputCGST += inv.cgstAmount;
    outputSGST += inv.sgstAmount;
    outputIGST += inv.igstAmount;
  });

  // Inward input tax credit (ITC) from purchases
  let totalTaxablePurchases = 0;
  let itcCGST = 0;
  let itcSGST = 0;
  let itcIGST = 0;

  purchaseOrders.filter(p => p.status === 'completed').forEach(po => {
    totalTaxablePurchases += po.subtotal;
    itcCGST += po.cgstAmount;
    itcSGST += po.sgstAmount;
    itcIGST += po.igstAmount;
  });

  const netPayableCGST = Math.max(0, outputCGST - itcCGST);
  const netPayableSGST = Math.max(0, outputSGST - itcSGST);
  const netPayableIGST = Math.max(0, outputIGST - itcIGST);

  res.status(200).json({
    success: true,
    data: {
      period: `${new Date().toLocaleString('default', { month: 'short' })} ${new Date().getFullYear()}`,
      gstr1: {
        totalInvoices: invoices.length,
        taxableSupplies: totalTaxableSales,
        outputCGST,
        outputSGST,
        outputIGST,
        totalOutputTax: outputCGST + outputSGST + outputIGST
      },
      gstr3b: {
        eligibleITC: {
          cgst: itcCGST,
          sgst: itcSGST,
          igst: itcIGST,
          totalITC: itcCGST + itcSGST + itcIGST
        },
        netTaxPayable: {
          cgst: netPayableCGST,
          sgst: netPayableSGST,
          igst: netPayableIGST,
          totalPayable: netPayableCGST + netPayableSGST + netPayableIGST
        }
      }
    }
  });
});

export default router;


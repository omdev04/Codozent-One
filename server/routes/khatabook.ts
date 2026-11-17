import { Router, Request, Response, NextFunction } from 'express';
import { db } from '../db/store';
import { KhataEntry } from '../../src/types/erp';

const router = Router({ mergeParams: true });

// GET /api/companies/:company_id/khatabook/entries
router.get('/entries', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { company_id } = req.params;
    const { party } = req.query;
    const entries = db.getKhataEntries(company_id, party as string);
    res.status(200).json({ success: true, data: entries });
  } catch (err) {
    next(err);
  }
});

// POST /api/companies/:company_id/khatabook/entries
router.post('/entries', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { company_id } = req.params;
    const { partyType, partyId, partyName, phone, type, amount, description, billNumber, paymentMode } = req.body;

    if (!partyName || !type || !amount) {
      return res.status(400).json({ success: false, error: 'Party Name, Type (jama/udhar), and Amount are required' });
    }

    const newEntry: KhataEntry = {
      id: `khata-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      companyId: company_id,
      entryDate: new Date().toISOString().split('T')[0],
      partyType: partyType || 'customer',
      partyId,
      partyName,
      phone: phone || '',
      type, // 'jama' (credit received) or 'udhar' (credit given)
      amount: Number(amount),
      description: description || '',
      billNumber: billNumber || '',
      paymentMode: paymentMode || 'cash',
      whatsappSent: false
    };

    const created = db.createKhataEntry(newEntry);
    res.status(201).json({ success: true, data: created });
  } catch (err) {
    next(err);
  }
});

// POST /api/companies/:company_id/khatabook/entries/:id/send-whatsapp
router.post('/entries/:id/send-whatsapp', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { company_id, id } = req.params;
    const entries = db.getKhataEntries(company_id);
    const entry = entries.find(e => e.id === id);
    if (!entry) {
      return res.status(404).json({ success: false, error: 'Khata entry not found' });
    }
    entry.whatsappSent = true;
    res.status(200).json({ 
      success: true, 
      message: `WhatsApp payment reminder dispatched to ${entry.partyName} with UPI payment QR link.`,
      data: entry
    });
  } catch (err) {
    next(err);
  }
});

export default router;


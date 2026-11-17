import { Router, Request, Response, NextFunction } from 'express';
import { db } from '../db/store';

const router = Router({ mergeParams: true });

// GET /api/companies/:company_id/gst/summary
router.get('/summary', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { company_id } = req.params;
    const summary = db.getGstSummary(company_id);
    res.status(200).json({ success: true, data: summary });
  } catch (err) {
    next(err);
  }
});

// GET /api/companies/:company_id/gst/2b-match
router.get('/2b-match', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { company_id } = req.params;
    const records = db.getGst2BRecords(company_id);
    res.status(200).json({ success: true, data: records });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/companies/:company_id/gst/2b-match/:id
router.patch('/2b-match/:id', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { company_id, id } = req.params;
    const { action } = req.body; // 'claim' | 'hold' | 'reverse'
    const updated = db.updateGst2BAction(company_id, id, action);
    if (!updated) {
      return res.status(404).json({ success: false, error: '2B Match record not found' });
    }
    res.status(200).json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
});

export default router;


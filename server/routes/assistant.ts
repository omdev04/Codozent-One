import { Router, Request, Response, NextFunction } from 'express';
import { db } from '../db/store';

const router = Router({ mergeParams: true });

// POST /api/companies/:company_id/assistant/chat
router.post('/chat', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { company_id } = req.params;
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ success: false, error: 'Query message is required' });
    }

    const result = db.askAssistant(company_id, message);

    res.status(200).json({
      success: true,
      data: {
        reply: result.reply,
        actionSuggested: result.action,
        timestamp: new Date().toISOString()
      }
    });
  } catch (err) {
    next(err);
  }
});

export default router;


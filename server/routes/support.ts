import { Router, Request, Response, NextFunction } from 'express';
import { db } from '../db/store';
import { SupportTicket } from '../../src/types/erp';

const router = Router({ mergeParams: true });

// GET /api/companies/:company_id/support/tickets
router.get('/tickets', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { company_id } = req.params;
    const tickets = db.getSupportTickets(company_id);
    res.status(200).json({ success: true, data: tickets });
  } catch (err) {
    next(err);
  }
});

// POST /api/companies/:company_id/support/tickets
router.post('/tickets', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { company_id } = req.params;
    const { customerId, customerName, customerEmail, customerPhone, subject, category, priority, initialMessage, assignedTo } = req.body;

    if (!customerName || !subject) {
      return res.status(400).json({ success: false, error: 'Customer name and Subject are required' });
    }

    const ticketNumber = `TCK-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`;

    const newTicket: SupportTicket = {
      id: `tck-${Date.now()}`,
      companyId: company_id,
      ticketNumber,
      customerId,
      customerName,
      customerEmail: customerEmail || '',
      customerPhone: customerPhone || '',
      subject,
      category: category || 'general',
      priority: priority || 'medium',
      status: 'open',
      assignedTo: assignedTo || 'Support Desk',
      createdAt: new Date().toISOString(),
      slaHoursRemaining: priority === 'urgent' ? 4 : priority === 'high' ? 12 : 24,
      messages: [
        {
          id: `msg-${Date.now()}`,
          sender: customerName,
          senderType: 'customer',
          message: initialMessage || subject,
          timestamp: new Date().toISOString()
        }
      ]
    };

    const created = db.createSupportTicket(newTicket);
    res.status(201).json({ success: true, data: created });
  } catch (err) {
    next(err);
  }
});

// POST /api/companies/:company_id/support/tickets/:id/reply
router.post('/tickets/:id/reply', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { company_id, id } = req.params;
    const { sender, senderType, message } = req.body;

    if (!message) {
      return res.status(400).json({ success: false, error: 'Message cannot be empty' });
    }

    const updated = db.addTicketMessage(
      company_id,
      id,
      sender || 'Support Agent',
      senderType || 'staff',
      message
    );

    if (!updated) {
      return res.status(404).json({ success: false, error: 'Ticket not found' });
    }

    res.status(200).json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/companies/:company_id/support/tickets/:id/status
router.patch('/tickets/:id/status', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { company_id, id } = req.params;
    const { status } = req.body;

    const updated = db.updateTicketStatus(company_id, id, status);
    if (!updated) {
      return res.status(404).json({ success: false, error: 'Ticket not found' });
    }

    res.status(200).json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
});

export default router;


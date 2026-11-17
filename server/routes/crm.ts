import { Router, Request, Response, NextFunction } from 'express';
import { db } from '../db/store';
import { CrmLead, CrmLeadFollowup, CrmLeadActivity, CrmLeadDocument } from '../../src/types/erp';

const router = Router({ mergeParams: true });

// Helper to normalize phone
function normalizePhone(phone?: string): string {
  if (!phone) return '';
  return phone.replace(/[^0-9]/g, '').slice(-10);
}

// ---------------------------------------------------------------------------
// 1. GET /api/companies/:company_id/crm/leads (Listing, Search, Filter, Sort, Pagination)
// ---------------------------------------------------------------------------
router.get('/leads', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { company_id } = req.params;
    const { 
      status, 
      source, 
      priority, 
      assignedTo, 
      industry,
      search, 
      sortBy = 'createdAt', 
      sortOrder = 'desc',
      page = '1',
      limit = '100'
    } = req.query as Record<string, string>;

    let leads = db.getLeads(company_id);

    // Filter by stage / status
    if (status && status !== 'all') {
      leads = leads.filter(l => l.status === status);
    }

    // Filter by source
    if (source && source !== 'all') {
      leads = leads.filter(l => l.source === source);
    }

    // Filter by priority
    if (priority && priority !== 'all') {
      leads = leads.filter(l => l.priority === priority);
    }

    // Filter by assigned employee
    if (assignedTo && assignedTo !== 'all') {
      leads = leads.filter(l => (l.assignedTo === assignedTo || l.assignedToName === assignedTo));
    }

    // Filter by industry
    if (industry && industry !== 'all') {
      leads = leads.filter(l => l.industry?.toLowerCase().includes(industry.toLowerCase()));
    }

    // Search by title, company, contact name, phone, email, lead ID
    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      leads = leads.filter(l => 
        (l.title && l.title.toLowerCase().includes(q)) ||
        (l.leadNumber && l.leadNumber.toLowerCase().includes(q)) ||
        (l.companyName && l.companyName.toLowerCase().includes(q)) ||
        (l.contactName && l.contactName.toLowerCase().includes(q)) ||
        (l.phone && l.phone.includes(q)) ||
        (l.email && l.email.toLowerCase().includes(q)) ||
        (l.city && l.city.toLowerCase().includes(q)) ||
        (l.productInterest && l.productInterest.toLowerCase().includes(q))
      );
    }

    // Sorting
    leads.sort((a, b) => {
      let valA: any = (a as any)[sortBy];
      let valB: any = (b as any)[sortBy];

      if (sortBy === 'dealValue' || sortBy === 'winProbability' || sortBy === 'score') {
        valA = Number(valA) || 0;
        valB = Number(valB) || 0;
      } else {
        valA = String(valA || '').toLowerCase();
        valB = String(valB || '').toLowerCase();
      }

      if (sortOrder === 'asc') {
        return valA > valB ? 1 : valA < valB ? -1 : 0;
      } else {
        return valA < valB ? 1 : valA > valB ? -1 : 0;
      }
    });

    const total = leads.length;
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 100;
    const startIndex = (pageNum - 1) * limitNum;
    const paginatedLeads = leads.slice(startIndex, startIndex + limitNum);

    res.status(200).json({
      success: true,
      data: paginatedLeads,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum)
      }
    });
  } catch (err) {
    next(err);
  }
});

// ---------------------------------------------------------------------------
// 2. GET /api/companies/:company_id/crm/stats (Tenant Dashboard Statistics)
// ---------------------------------------------------------------------------
router.get('/stats', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { company_id } = req.params;
    const leads = db.getLeads(company_id);
    const followups = db.getLeadFollowups(company_id);

    const todayStr = new Date().toISOString().split('T')[0];

    const stats = {
      totalLeads: leads.length,
      newLeads: leads.filter(l => l.status === 'new').length,
      contacted: leads.filter(l => l.status === 'contacted').length,
      qualified: leads.filter(l => l.status === 'qualified').length,
      requirementUnderstanding: leads.filter(l => l.status === 'requirement_understanding').length,
      quotationPreparation: leads.filter(l => l.status === 'quotation_preparation').length,
      quotationSent: leads.filter(l => l.status === 'quotation_sent' || (l.status as any) === 'proposal').length,
      negotiation: leads.filter(l => l.status === 'negotiation').length,
      won: leads.filter(l => l.status === 'won').length,
      lost: leads.filter(l => l.status === 'lost').length,
      onHold: leads.filter(l => l.status === 'on_hold').length,
      pipelineValue: leads
        .filter(l => l.status !== 'lost' && l.status !== 'won')
        .reduce((sum, l) => sum + (Number(l.dealValue) || 0), 0),
      wonValue: leads
        .filter(l => l.status === 'won')
        .reduce((sum, l) => sum + (Number(l.dealValue) || 0), 0),
      followupsDueToday: followups.filter(f => !f.isCompleted && f.scheduledDate === todayStr).length,
      followupsOverdue: followups.filter(f => !f.isCompleted && f.scheduledDate < todayStr).length,
      sourceBreakdown: leads.reduce((acc: Record<string, number>, l) => {
        const src = l.source || 'other';
        acc[src] = (acc[src] || 0) + 1;
        return acc;
      }, {}),
      stageDistribution: leads.reduce((acc: Record<string, { count: number; value: number }>, l) => {
        const stage = l.status || 'new';
        if (!acc[stage]) acc[stage] = { count: 0, value: 0 };
        acc[stage].count += 1;
        acc[stage].value += Number(l.dealValue) || 0;
        return acc;
      }, {})
    };

    res.status(200).json({ success: true, data: stats });
  } catch (err) {
    next(err);
  }
});

// ---------------------------------------------------------------------------
// 3. POST /api/companies/:company_id/crm/leads/check-duplicate
// ---------------------------------------------------------------------------
router.post('/leads/check-duplicate', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { company_id } = req.params;
    const { phone, email, companyName, excludeId } = req.body;

    const existingLeads = db.getLeads(company_id).filter(l => !excludeId || l.id !== excludeId);
    const normPhone = normalizePhone(phone);
    const normEmail = (email || '').trim().toLowerCase();
    const normCompany = (companyName || '').trim().toLowerCase();

    const matches = existingLeads.filter(l => {
      const matchPhone = normPhone && normalizePhone(l.phone) === normPhone;
      const matchEmail = normEmail && l.email && l.email.trim().toLowerCase() === normEmail;
      const matchCompany = normCompany && l.companyName && l.companyName.trim().toLowerCase() === normCompany;
      return matchPhone || matchEmail || matchCompany;
    });

    res.status(200).json({
      success: true,
      hasDuplicates: matches.length > 0,
      duplicates: matches.map(m => ({
        id: m.id,
        leadNumber: m.leadNumber,
        companyName: m.companyName,
        contactName: m.contactName,
        phone: m.phone,
        email: m.email,
        status: m.status,
        dealValue: m.dealValue
      }))
    });
  } catch (err) {
    next(err);
  }
});

// ---------------------------------------------------------------------------
// 4. POST /api/companies/:company_id/crm/leads (Create Lead)
// ---------------------------------------------------------------------------
router.post('/leads', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { company_id } = req.params;
    const body = req.body;

    // Required fields validation
    if (!body.companyName?.trim()) {
      return res.status(400).json({ success: false, error: 'Company Name is required' });
    }
    if (!body.contactName?.trim()) {
      return res.status(400).json({ success: false, error: 'Contact Person Name is required' });
    }
    if (!body.phone?.trim()) {
      return res.status(400).json({ success: false, error: 'Contact Mobile Number is required' });
    }

    // Optional GSTIN format check
    if (body.gstin && body.gstin.trim()) {
      const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
      if (!gstinRegex.test(body.gstin.trim().toUpperCase())) {
        return res.status(400).json({ 
          success: false, 
          error: 'Invalid GSTIN format. Expected format: 27AAAAA0000A1Z5 (15 characters)' 
        });
      }
    }

    const createdLead = db.createLead({
      ...body,
      companyId: company_id,
      createdBy: (req as any).user?.name || 'Sales Staff'
    });

    db.logAudit({
      companyId: company_id,
      userName: (req as any).user?.name || 'User',
      action: 'CREATE',
      entityName: 'CrmLead',
      entityId: createdLead.id,
      details: `Created lead ${createdLead.leadNumber} (${createdLead.companyName}) for ₹${createdLead.dealValue.toLocaleString('en-IN')}`,
      timestamp: new Date().toISOString()
    });

    res.status(201).json({ success: true, data: createdLead });
  } catch (err) {
    next(err);
  }
});

// ---------------------------------------------------------------------------
// 5. GET /api/companies/:company_id/crm/leads/:id (Lead Detail)
// ---------------------------------------------------------------------------
router.get('/leads/:id', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { company_id, id } = req.params;
    const lead = db.getLead(company_id, id);
    if (!lead) {
      return res.status(404).json({ success: false, error: 'Lead not found' });
    }

    const activities = db.getLeadActivities(company_id, lead.id);
    const followups = db.getLeadFollowups(company_id, lead.id);
    const documents = db.getLeadDocuments(company_id, lead.id);
    const quotations = db.getQuotations(company_id).filter(q => q.leadId === lead.id || q.quotationNumber === lead.convertedQuotationNumber);

    res.status(200).json({
      success: true,
      data: {
        ...lead,
        activities,
        followups,
        documents,
        quotations
      }
    });
  } catch (err) {
    next(err);
  }
});

// ---------------------------------------------------------------------------
// 6. PATCH /api/companies/:company_id/crm/leads/:id (Update Lead)
// ---------------------------------------------------------------------------
router.patch('/leads/:id', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { company_id, id } = req.params;
    const performer = (req as any).user?.name || 'Sales Executive';

    // If GSTIN supplied, validate
    if (req.body.gstin && req.body.gstin.trim()) {
      const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
      if (!gstinRegex.test(req.body.gstin.trim().toUpperCase())) {
        return res.status(400).json({ 
          success: false, 
          error: 'Invalid GSTIN format. Expected format: 27AAAAA0000A1Z5' 
        });
      }
    }

    const updated = db.updateLead(company_id, id, req.body, performer);
    if (!updated) {
      return res.status(404).json({ success: false, error: 'Lead not found' });
    }

    db.logAudit({
      companyId: company_id,
      userName: performer,
      action: 'UPDATE',
      entityName: 'CrmLead',
      entityId: updated.id,
      details: `Updated lead ${updated.leadNumber} (${updated.companyName})`,
      timestamp: new Date().toISOString()
    });

    res.status(200).json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
});

// ---------------------------------------------------------------------------
// 7. DELETE /api/companies/:company_id/crm/leads/:id (Delete / Archive Lead)
// ---------------------------------------------------------------------------
router.delete('/leads/:id', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { company_id, id } = req.params;
    const lead = db.getLead(company_id, id);
    if (!lead) {
      return res.status(404).json({ success: false, error: 'Lead not found' });
    }

    const success = db.deleteLead(company_id, id);
    if (!success) {
      return res.status(500).json({ success: false, error: 'Failed to delete lead' });
    }

    db.logAudit({
      companyId: company_id,
      userName: (req as any).user?.name || 'User',
      action: 'DELETE',
      entityName: 'CrmLead',
      entityId: id,
      details: `Deleted lead ${lead.leadNumber} (${lead.companyName})`,
      timestamp: new Date().toISOString()
    });

    res.status(200).json({ success: true, message: 'Lead deleted successfully' });
  } catch (err) {
    next(err);
  }
});

// ---------------------------------------------------------------------------
// 8. GET & POST /api/companies/:company_id/crm/leads/:id/activities
// ---------------------------------------------------------------------------
router.get('/leads/:id/activities', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { company_id, id } = req.params;
    const activities = db.getLeadActivities(company_id, id);
    res.status(200).json({ success: true, data: activities });
  } catch (err) {
    next(err);
  }
});

router.post('/leads/:id/activities', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { company_id, id } = req.params;
    const { type, title, description, metadata } = req.body;

    if (!title) {
      return res.status(400).json({ success: false, error: 'Activity title is required' });
    }

    const newActivity: CrmLeadActivity = {
      id: `act-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      leadId: id,
      companyId: company_id,
      type: type || 'note',
      title,
      description: description || '',
      performedBy: (req as any).user?.name || 'Sales Staff',
      metadata: metadata || {},
      performedAt: new Date().toISOString()
    };

    const created = db.createLeadActivity(newActivity);
    res.status(201).json({ success: true, data: created });
  } catch (err) {
    next(err);
  }
});

// ---------------------------------------------------------------------------
// 9. GET, POST, PATCH /api/companies/:company_id/crm/followups
// ---------------------------------------------------------------------------
router.get('/followups', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { company_id } = req.params;
    const { leadId, filter } = req.query as Record<string, string>;

    let followups = db.getLeadFollowups(company_id, leadId);
    const today = new Date().toISOString().split('T')[0];

    if (filter === 'today') {
      followups = followups.filter(f => !f.isCompleted && f.scheduledDate === today);
    } else if (filter === 'upcoming') {
      followups = followups.filter(f => !f.isCompleted && f.scheduledDate > today);
    } else if (filter === 'overdue') {
      followups = followups.filter(f => !f.isCompleted && f.scheduledDate < today);
    } else if (filter === 'completed') {
      followups = followups.filter(f => f.isCompleted);
    }

    res.status(200).json({ success: true, data: followups });
  } catch (err) {
    next(err);
  }
});

router.post('/followups', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { company_id } = req.params;
    const { leadId, scheduledDate, scheduledTime, type, assignedTo, title, notes } = req.body;

    if (!leadId || !scheduledDate || !title) {
      return res.status(400).json({ success: false, error: 'Lead ID, scheduled date, and title are required' });
    }

    const newFollowup: CrmLeadFollowup = {
      id: `flw-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      leadId,
      companyId: company_id,
      scheduledDate,
      scheduledTime: scheduledTime || '11:00',
      type: type || 'call',
      assignedTo: assignedTo || 'Sales Staff',
      assignedToName: assignedTo || 'Sales Staff',
      title,
      notes: notes || '',
      isCompleted: false,
      createdAt: new Date().toISOString()
    };

    const created = db.createLeadFollowup(newFollowup);
    res.status(201).json({ success: true, data: created });
  } catch (err) {
    next(err);
  }
});

router.patch('/followups/:id', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { company_id, id } = req.params;
    const performer = (req as any).user?.name || 'Sales Staff';
    const updated = db.updateLeadFollowup(company_id, id, req.body, performer);
    if (!updated) {
      return res.status(404).json({ success: false, error: 'Follow-up not found' });
    }
    res.status(200).json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
});

// ---------------------------------------------------------------------------
// 10. GET & POST & DELETE /api/companies/:company_id/crm/leads/:id/documents
// ---------------------------------------------------------------------------
router.get('/leads/:id/documents', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { company_id, id } = req.params;
    const docs = db.getLeadDocuments(company_id, id);
    res.status(200).json({ success: true, data: docs });
  } catch (err) {
    next(err);
  }
});

router.post('/leads/:id/documents', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { company_id, id } = req.params;
    const { fileName, fileSize, fileType, storagePath, fileUrl, notes } = req.body;

    if (!fileName) {
      return res.status(400).json({ success: false, error: 'File name is required' });
    }

    const newDoc: CrmLeadDocument = {
      id: `doc-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      leadId: id,
      companyId: company_id,
      fileName,
      fileSize: Number(fileSize) || 1024,
      fileType: fileType || 'application/pdf',
      storagePath: storagePath || `/uploads/${company_id}/${fileName}`,
      fileUrl: fileUrl || `/uploads/${company_id}/${fileName}`,
      uploadedBy: (req as any).user?.name || 'Engineer',
      notes: notes || '',
      uploadedAt: new Date().toISOString()
    };

    const created = db.createLeadDocument(newDoc);
    res.status(201).json({ success: true, data: created });
  } catch (err) {
    next(err);
  }
});

router.delete('/documents/:id', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { company_id, id } = req.params;
    const success = db.deleteLeadDocument(company_id, id);
    if (!success) {
      return res.status(404).json({ success: false, error: 'Document not found' });
    }
    res.status(200).json({ success: true, message: 'Document deleted' });
  } catch (err) {
    next(err);
  }
});

// ---------------------------------------------------------------------------
// 11. POST /api/companies/:company_id/crm/leads/:id/convert-to-quotation
// ---------------------------------------------------------------------------
router.post('/leads/:id/convert-to-quotation', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { company_id, id } = req.params;
    const user = { name: (req as any).user?.name || 'Sales Executive' };

    const result = db.convertLeadToQuotation(company_id, id, user);
    if (!result) {
      return res.status(404).json({ success: false, error: 'Lead not found for conversion' });
    }

    db.logAudit({
      companyId: company_id,
      userName: user.name,
      action: 'CREATE',
      entityName: 'Quotation',
      entityId: result.quotation.id,
      details: `Converted lead ${result.lead.leadNumber} to draft quotation ${result.quotation.quotationNumber}`,
      timestamp: new Date().toISOString()
    });

    res.status(200).json({
      success: true,
      message: `Lead successfully converted to Quotation Draft ${result.quotation.quotationNumber}`,
      data: result
    });
  } catch (err) {
    next(err);
  }
});

// ---------------------------------------------------------------------------
// 12. POST /api/companies/:company_id/crm/leads/import (CSV Batch Import)
// ---------------------------------------------------------------------------
router.post('/leads/import', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { company_id } = req.params;
    const { rows, skipDuplicates = true } = req.body as { rows: any[]; skipDuplicates?: boolean };

    if (!Array.isArray(rows) || rows.length === 0) {
      return res.status(400).json({ success: false, error: 'No data rows provided for import' });
    }

    const existingLeads = db.getLeads(company_id);
    const existingPhones = new Set(existingLeads.map(l => normalizePhone(l.phone)));
    const existingEmails = new Set(existingLeads.map(l => l.email?.trim().toLowerCase()).filter(Boolean));

    const imported: CrmLead[] = [];
    const skipped: { row: number; reason: string; item: any }[] = [];

    rows.forEach((row, idx) => {
      const companyName = row.companyName || row['Company Name'] || row.company;
      const contactName = row.contactName || row['Contact Person'] || row.contact;
      const phone = row.phone || row['Mobile'] || row['Phone Number'];
      const email = row.email || row['Email'];
      const dealValue = Number(row.dealValue || row['Deal Value'] || row.value) || 0;
      const source = (row.source || row['Lead Source'] || 'direct').toLowerCase();

      if (!companyName || !contactName || !phone) {
        skipped.push({ row: idx + 1, reason: 'Missing required Company Name, Contact Name, or Phone', item: row });
        return;
      }

      const normPh = normalizePhone(phone);
      const normEm = email ? email.trim().toLowerCase() : '';

      if (skipDuplicates && ((normPh && existingPhones.has(normPh)) || (normEm && existingEmails.has(normEm)))) {
        skipped.push({ row: idx + 1, reason: 'Duplicate Phone Number or Email detected', item: row });
        return;
      }

      const lead = db.createLead({
        companyId: company_id,
        companyName,
        contactName,
        phone,
        email,
        source: source as any,
        dealValue,
        city: row.city || row['City'] || 'Pune',
        status: 'new',
        priority: (row.priority || 'medium').toLowerCase() as any,
        requirementDescription: row.requirementDescription || row['Requirement'] || '',
        productInterest: row.productInterest || row['Product'] || '',
        notes: `Imported via CSV batch on ${new Date().toLocaleDateString('en-IN')}`
      });

      if (normPh) existingPhones.add(normPh);
      if (normEm) existingEmails.add(normEm);
      imported.push(lead);
    });

    res.status(200).json({
      success: true,
      data: {
        totalReceived: rows.length,
        importedCount: imported.length,
        skippedCount: skipped.length,
        skipped,
        sampleImported: imported.slice(0, 5)
      }
    });
  } catch (err) {
    next(err);
  }
});

export default router;

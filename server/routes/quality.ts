import { Router, Response } from 'express';
import { db } from '../db/store';
import { AuthenticatedRequest } from '../middleware/auth';
import { QualityInspection } from '../../src/types/erp';

const router = Router({ mergeParams: true });

// GET /api/companies/:company_id/inspections
router.get('/inspections', (req: AuthenticatedRequest, res: Response) => {
  const companyId = req.params.company_id;
  const list = db.getQualityInspections(companyId);
  res.status(200).json({ success: true, data: list });
});

// POST /api/companies/:company_id/inspections
router.post('/inspections', (req: AuthenticatedRequest, res: Response) => {
  const companyId = req.params.company_id;
  const { refType, refId, itemId, status, sampleSize, checkpoints, rootCause } = req.body;

  const item = db.getItem(companyId, itemId);
  const inspectionNumber = db.getNextSequence(companyId, 'QC', 'quality_inspection');

  const inspection: QualityInspection = {
    id: `qc-${Date.now().toString(36)}`,
    companyId,
    inspectionNumber,
    referenceType: refType,
    referenceId: refId,
    itemId,
    itemCode: item ? item.itemCode : '',
    itemName: item ? item.name : '',
    inspectionDate: new Date().toISOString().split('T')[0],
    inspectorName: req.user ? req.user.name : 'Senior QC Inspector',
    status: status || 'passed',
    sampleSize: sampleSize || 5,
    checkpoints: checkpoints || [
      { id: 'cp-1', parameterName: 'Dimensional Runout (OD)', nominalValue: '40.00 mm', toleranceMin: '-0.02', toleranceMax: '+0.02', actualValue: '40.005 mm', status: 'pass' },
      { id: 'cp-2', parameterName: 'Surface Finish Ra', nominalValue: '0.8 µm', toleranceMin: '0.0', toleranceMax: '+0.2', actualValue: '0.72 µm', status: 'pass' }
    ],
    notes: rootCause || 'Inspection approved under ISO 9001:2015 / IATF guidelines'
  };

  db.addQualityInspection(inspection);
  res.status(201).json({ success: true, data: inspection });
});

export default router;


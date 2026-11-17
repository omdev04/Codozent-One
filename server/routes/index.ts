import { Router, Request, Response } from 'express';
import authRoutes from './auth';
import companiesRoutes from './companies';
import customersRoutes from './customers';
import suppliersRoutes from './suppliers';
import itemsRoutes from './items';
import bomsRoutes from './boms';
import salesRoutes from './sales';
import purchaseRoutes from './purchase';
import manufacturingRoutes from './manufacturing';
import qualityRoutes from './quality';
import inventoryRoutes from './inventory';
import financeRoutes from './finance';
import reportsRoutes from './reports';
import seedRoutes from './seed';
import crmRoutes from './crm';
import workRoutes from './work';
import khatabookRoutes from './khatabook';
import gstRoutes from './gst';
import caDeskRoutes from './caDesk';
import counterRoutes from './counter';
import hrmsRoutes from './hrms';
import supportRoutes from './support';
import assistantRoutes from './assistant';
import settingsRoutes from './settings';
import modulesRoutes from './modules';
import accessRoutes from './access';
import branchesRoutes from './branches';
import platformRoutes from '../platform/routes';
import { validateCompanyContext } from '../middleware/companyContext';
import { optionalAuth } from '../middleware/auth';

const router = Router();

// Health Check Endpoint
router.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'Codozent One (Holistic) ERP API Engine',
    uptime: process.uptime()
  });
});

// Authentication Routes
router.use('/auth', authRoutes);

// Settings Routes (Supabase & Engine)
router.use('/settings', settingsRoutes);

// Dedicated global SaaS operator area. This router has its own identity model and
// never inherits a customer-company context or tenant role.
router.use('/platform', platformRoutes);

// Companies Routes
router.use('/companies', companiesRoutes);

// Multi-tenant Company Sub-routes (enforces company context and tenancy isolation)
const companyRouter = Router({ mergeParams: true });
companyRouter.use(optionalAuth);
companyRouter.use(validateCompanyContext);

companyRouter.use('/customers', customersRoutes);
companyRouter.use('/modules', modulesRoutes);
companyRouter.use('/access', accessRoutes);
companyRouter.use('/branches', branchesRoutes);
companyRouter.use('/suppliers', suppliersRoutes);
companyRouter.use('/items', itemsRoutes);
companyRouter.use('/boms', bomsRoutes);
companyRouter.use('/crm', crmRoutes);
companyRouter.use('/work', workRoutes);
companyRouter.use('/khatabook', khatabookRoutes);
companyRouter.use('/gst', gstRoutes);
companyRouter.use('/ca-desk', caDeskRoutes);
companyRouter.use('/counter', counterRoutes);
companyRouter.use('/hrms', hrmsRoutes);
companyRouter.use('/support', supportRoutes);
companyRouter.use('/assistant', assistantRoutes);
companyRouter.use('/', salesRoutes);
companyRouter.use('/', purchaseRoutes);
companyRouter.use('/', manufacturingRoutes);
companyRouter.use('/', qualityRoutes);
companyRouter.use('/', inventoryRoutes);
companyRouter.use('/', financeRoutes);
companyRouter.use('/', reportsRoutes);
companyRouter.use('/', seedRoutes);

router.use('/companies/:company_id', companyRouter);

export default router;


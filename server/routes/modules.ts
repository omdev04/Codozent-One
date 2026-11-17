import { Router, Response } from 'express';
import { db } from '../db/store';
import { AuthenticatedRequest } from '../middleware/auth';
import { MODULE_REGISTRY, validateModuleDependencies } from '../../src/lib/moduleRegistry';

const router = Router({ mergeParams: true });

// -----------------------------------------------------------------------------
// GET /api/companies/:company_id/modules
// List all modules with their activation status for the active company
// -----------------------------------------------------------------------------
router.get('/', (req: AuthenticatedRequest, res: Response) => {
  const companyId = req.params.company_id;
  const companyModules = db.getCompanyModules(companyId);

  const manifestList = Object.values(MODULE_REGISTRY).map(manifest => {
    const existing = companyModules.find(cm => cm.moduleId === manifest.id);
    const isEnabled = existing ? existing.status === 'enabled' : true; // Default core/pre-installed
    return {
      manifest,
      status: isEnabled ? 'enabled' : 'disabled',
      settings: existing?.settings || manifest.defaultSettings || {}
    };
  });

  res.status(200).json({
    success: true,
    data: manifestList
  });
});

// -----------------------------------------------------------------------------
// POST /api/companies/:company_id/modules/:module_id/enable
// Enable a module for the company after dependency validation
// -----------------------------------------------------------------------------
router.post('/:module_id/enable', (req: AuthenticatedRequest, res: Response) => {
  const { company_id, module_id } = req.params;
  const { settings } = req.body || {};

  const manifest = MODULE_REGISTRY[module_id];
  if (!manifest) {
    res.status(404).json({
      success: false,
      error: { code: 'MODULE_NOT_FOUND', message: `Module '${module_id}' is not in the registry` }
    });
    return;
  }

  // Validate dependencies
  const activeCompanyModules = db.getCompanyModules(company_id);
  const currentlyEnabled = Object.keys(MODULE_REGISTRY).filter(id => {
    const rec = activeCompanyModules.find(m => m.moduleId === id);
    return rec ? rec.status === 'enabled' : true;
  });

  const depCheck = validateModuleDependencies(module_id, currentlyEnabled);
  if (!depCheck.canEnable) {
    res.status(400).json({
      success: false,
      error: {
        code: 'MISSING_DEPENDENCIES',
        message: `Cannot enable module. Missing required dependencies: ${depCheck.missingDependencies.join(', ')}`
      }
    });
    return;
  }

  const updated = db.setCompanyModuleStatus(company_id, module_id, 'enabled', settings);

  res.status(200).json({
    success: true,
    data: updated,
    message: `Module '${manifest.name}' successfully activated for this company`
  });
});

// -----------------------------------------------------------------------------
// POST /api/companies/:company_id/modules/:module_id/disable
// Safely deactivate a module (Non-destructive: preserves all historical data)
// -----------------------------------------------------------------------------
router.post('/:module_id/disable', (req: AuthenticatedRequest, res: Response) => {
  const { company_id, module_id } = req.params;

  if (module_id === 'dashboard' || module_id === 'settings' || module_id === 'reports') {
    res.status(400).json({
      success: false,
      error: { code: 'CORE_MODULE_LOCKED', message: 'Core system modules cannot be deactivated' }
    });
    return;
  }

  const updated = db.setCompanyModuleStatus(company_id, module_id, 'disabled');

  res.status(200).json({
    success: true,
    data: updated,
    message: `Module deactivated. Historical records have been preserved.`
  });
});

// -----------------------------------------------------------------------------
// PUT /api/companies/:company_id/modules/:module_id/settings
// Update module specific parameters
// -----------------------------------------------------------------------------
router.put('/:module_id/settings', (req: AuthenticatedRequest, res: Response) => {
  const { company_id, module_id } = req.params;
  const settings = req.body || {};

  const updated = db.setCompanyModuleStatus(company_id, module_id, 'enabled', settings);

  res.status(200).json({
    success: true,
    data: updated
  });
});

export default router;

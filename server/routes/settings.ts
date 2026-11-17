import { Router, Request, Response } from 'express';
import { 
  isServerSupabaseConfigured, 
  serverSupabase, 
  testServerSupabase, 
  setServerSupabaseCredentials 
} from '../db/supabase';

const router = Router();

// GET /api/settings/supabase
router.get('/supabase', (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    data: {
      isConfigured: isServerSupabaseConfigured,
      hasClient: Boolean(serverSupabase)
    }
  });
});

// POST /api/settings/supabase/test
router.post('/supabase/test', async (req: Request, res: Response) => {
  const { url, key } = req.body || {};
  if (url && key) {
    setServerSupabaseCredentials(url, key);
  }
  const result = await testServerSupabase();
  res.status(200).json({
    success: result.success,
    data: result
  });
});

export default router;


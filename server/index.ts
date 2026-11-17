import express from 'express';
import path from 'path';
import fs from 'fs';
import { env } from './config/env';
import { securityHeaders, apiLimiter, corsMiddleware } from './middleware/security';
import { errorHandler } from './middleware/errorHandler';
import apiRouter from './routes';

async function bootstrap() {
  const app = express();
  const PORT = env.PORT || 5000;
  const isProduction = env.NODE_ENV === 'production';
  const distPath = path.resolve(process.cwd(), 'dist');

  // Security & Parsing Middlewares
  app.use(corsMiddleware);
  app.use(securityHeaders);
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // API Router with Rate Limiting
  app.use('/api', apiLimiter, apiRouter);

  // Frontend Integration (Unified Single Port)
  if (!isProduction && !fs.existsSync(distPath)) {
    // In development mode without a pre-built dist folder, attach Vite dev server middleware
    console.log('[FactoryFlow] Initializing Vite development middleware for unified port...');
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
      root: process.cwd()
    });
    app.use(vite.middlewares);
  } else {
    // In production or when dist folder is present, serve compiled static assets
    console.log(`[FactoryFlow] Serving compiled frontend from ${distPath}`);
    app.use(express.static(distPath));

    app.use((req, res, next) => {
      // Avoid intercepting API routes
      if (req.path.startsWith('/api')) {
        return next();
      }
      const indexPath = path.join(distPath, 'index.html');
      if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
      } else {
        res.status(404).send('Frontend bundle not found. Please run `npm run build` first.');
      }
    });
  }

  // Centralized Error Handler (must be after routes)
  app.use(errorHandler);

  app.listen(PORT, '0.0.0.0', () => {
    console.log('\n========================================================================');
    console.log('🏭 FACTORYFLOW ERP - UNIFIED FULL-STACK ENGINE');
    console.log('========================================================================');
    console.log(`🚀 Unified Application running on: http://localhost:${PORT}`);
    console.log(`⚡ REST API Endpoints active at:   http://localhost:${PORT}/api`);
    console.log(`🏢 Multi-Tenant Industrial Belt:   Chakan-Pune Manufacturing SME`);
    console.log(`🔒 Security & Rate Limiting:       Active (OWASP Compliant)`);
    console.log('========================================================================\n');
  });
}

bootstrap().catch(err => {
  console.error('[Fatal] Failed to launch FactoryFlow unified server:', err);
  process.exit(1);
});

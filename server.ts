import './backend/config/env';
import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';

import authRoutes from './backend/api/authRoutes';
import onboardingRoutes from './backend/api/onboardingRoutes';
import journalRoutes from './backend/api/journalRoutes';
import wellnessRoutes from './backend/api/wellnessRoutes';
import goalsRoutes from './backend/api/goalsRoutes';
import educationRoutes from './backend/api/educationRoutes';
import storeRoutes from './backend/api/storeRoutes';
import aiRoutes from './backend/api/aiRoutes';
import adminRoutes from './backend/api/adminRoutes';
import thcJourneyRoutes from './backend/api/thcJourneyRoutes';
import cbdRoutes from './backend/api/cbdRoutes';
import marketplaceRoutes from './backend/api/marketplaceRoutes';
import marketplaceOrderRoutes from './backend/api/marketplaceOrderRoutes';
import financeRoutes from './backend/api/financeRoutes';
import logisticsRoutes from './backend/api/logisticsRoutes';
import { loyaltyRouter } from './backend/api/loyaltyRoutes';
import subscriptionRoutes from './backend/api/subscriptionRoutes';
import partnerStoreRoutes from './backend/api/partnerStoreRoutes';
import { marketingRouter } from './backend/routes/marketingRoutes';
import { communicationRouter } from './backend/api/communicationRoutes';
import securityRoutes from './backend/api/securityRoutes';
import { SecurityService } from './backend/services/security/securityService';
import { SystemConfigService } from './backend/services/security/systemConfigService';
import { verifyToken } from './backend/auth/auth';
import { UserRole } from './src/types/entities';
import { db } from './backend/db/database';

async function startServer() {
  await db.initSupabaseSync();

  const app = express();
  const PORT = 3000;

  // JSON Body parser with size limit & rawBody capture for Stripe webhooks
  app.use(
    express.json({
      limit: '2mb',
      verify: (req: any, _res, buf) => {
        req.rawBody = buf;
      },
    })
  );

  // 1. Production-Grade HTTP Security Headers & Cross-Origin
  app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    // Allow iframe embedding within AI Studio / container preview environment
    res.setHeader('Content-Security-Policy', "frame-ancestors 'self' *;");
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    
    // Enable CORS for API routes
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, stripe-signature, idempotency-key');

    if (req.method === 'OPTIONS') {
      return res.sendStatus(204);
    }
    next();
  });

  // 2. Input Sanitization Middleware (Module 18 - Sections 8, 9)
  app.use((req, _res, next) => {
    if (
      req.body &&
      typeof req.body === 'object' &&
      req.method !== 'GET' &&
      !req.path.startsWith('/api/finance/webhooks/')
    ) {
      // Sanitize string fields recursively against script/HTML tags
      req.body = SecurityService.sanitizeObject(req.body);
    }
    next();
  });

  // 3. Maintenance Mode Interceptor (Module 18 - Section 49)
  app.use((req, res, next) => {
    const config = SystemConfigService.getSystemConfig();
    if (config.maintenanceMode && req.path.startsWith('/api/') && !req.path.startsWith('/api/health') && !req.path.startsWith('/api/system/maintenance')) {
      const authHeader = req.headers.authorization;
      let isAdmin = false;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const decoded = verifyToken(authHeader.split(' ')[1]);
        if (decoded && (decoded.role === UserRole.ADMIN || (decoded.role as string) === 'PLATFORM_ADMIN' || (decoded.role as string) === 'SUPER_ADMIN')) {
          isAdmin = true;
        }
      }
      if (!isAdmin) {
        return res.status(503).json({
          error: 'MAINTENANCE_MODE',
          message: config.maintenanceMessage || 'Plateforme actuellement en maintenance.',
          estimatedEndTime: config.maintenanceEstimatedEndTime,
        });
      }
    }
    next();
  });

  // 4. Request logger for audit & debugging
  app.use((req, _res, next) => {
    if (req.path.startsWith('/api/')) {
      console.log(`[API] ${req.method} ${req.path}`);
    }
    next();
  });

  // 5. Health, Readiness & Liveness Probes (Module 18 - Section 39)
  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'ok',
      service: 'CANNABIS CARE API — Nexus Premium Solutions',
      version: '1.0.0',
      supabase: db.getSupabaseStatus(),
      timestamp: new Date().toISOString(),
    });
  });

  app.get('/api/ready', (_req, res) => {
    const sb = db.getSupabaseStatus();
    res.json({
      status: 'ready',
      database: sb.syncActive ? 'supabase_postgresql' : 'local_json_fallback',
      supabase: sb,
      timestamp: new Date().toISOString(),
    });
  });

  app.get('/api/live', (_req, res) => {
    res.json({
      status: 'alive',
      uptimeSeconds: process.uptime(),
      timestamp: new Date().toISOString(),
    });
  });

  // API Route mounting
  app.use('/api/security', securityRoutes);
  app.use('/api/privacy', securityRoutes);
  app.use('/api/system', securityRoutes);
  app.use('/api/auth', authRoutes);
  app.use('/api/onboarding', onboardingRoutes);
  app.use('/api/journal', journalRoutes);
  app.use('/api/wellness', wellnessRoutes);
  app.use('/api/goals', goalsRoutes);
  app.use('/api/education', educationRoutes);
  app.use('/api/stores', storeRoutes);
  app.use('/api/ai', aiRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api/thc-journey', thcJourneyRoutes);
  app.use('/api/cbd', cbdRoutes);
  app.use('/api/marketplace', marketplaceRoutes);
  app.use('/api/marketplace', marketplaceOrderRoutes);
  app.use('/api/finance', financeRoutes);
  app.use('/api/logistics', logisticsRoutes);
  app.use('/api/loyalty', loyaltyRouter);
  app.use('/api/subscriptions', subscriptionRoutes);
  app.use('/api/marketplace', partnerStoreRoutes);
  app.use('/api/marketing', marketingRouter);
  app.use('/api/communication', communicationRouter);
  app.use('/api', communicationRouter);

  // 404 handler for unmatched API routes (prevents leaking HTML from SPA fallback)
  app.all('/api/*', (_req, res) => {
    res.status(404).json({
      error: 'ENDPOINT_NOT_FOUND',
      message: 'Route API introuvable ou méthode non autorisée.',
      timestamp: new Date().toISOString(),
    });
  });

  // Centralized production error handler for API routes (prevents stack trace leaks)
  app.use('/api', (err: any, _req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('[API ERROR]', err?.message || err);
    if (res.headersSent) {
      return next(err);
    }
    const isProd = process.env.NODE_ENV === 'production';
    const status = typeof err?.status === 'number' && err.status >= 400 && err.status < 600 ? err.status : 500;
    res.status(status).json({
      error: err?.code || 'INTERNAL_SERVER_ERROR',
      message: isProd && status === 500 ? 'Une erreur interne est survenue. Veuillez réessayer ultérieurement.' : (err?.message || 'Erreur interne'),
      timestamp: new Date().toISOString(),
    });
  });

  // Vite middleware in dev, or static files in production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[CANNABIS CARE] Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

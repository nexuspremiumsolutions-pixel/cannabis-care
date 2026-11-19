import './backend/config/env';
import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { createExpressApp } from './backend/app';
import { db } from './backend/db/database';

async function startServer() {
  await db.initSupabaseSync();

  const app = createExpressApp();
  const PORT = Number(process.env.PORT) || 3000;

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

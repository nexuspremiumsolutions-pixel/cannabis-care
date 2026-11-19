import '../../backend/config/env';
import serverless from 'serverless-http';
import { createExpressApp } from '../../backend/app';
import { db } from '../../backend/db/database';

const app = createExpressApp();
const expressHandler = serverless(app, {
  binary: ['image/*', 'application/pdf'],
});

let syncInitPromise: Promise<unknown> | null = null;

function normalizeNetlifyPath(event: any) {
  if (event && typeof event.path === 'string') {
    const prefix = '/.netlify/functions/api';
    if (event.path.startsWith(prefix)) {
      const rest = event.path.slice(prefix.length);
      event.path = rest.startsWith('/api') ? rest : `/api${rest.startsWith('/') ? rest : `/${rest}`}`;
    } else if (!event.path.startsWith('/api')) {
      event.path = `/api${event.path.startsWith('/') ? event.path : `/${event.path}`}`;
    }
  }
}

export const handler = async (event: any, context: any) => {
  if (context && typeof context.callbackWaitsForEmptyEventLoop === 'boolean') {
    context.callbackWaitsForEmptyEventLoop = false;
  }

  normalizeNetlifyPath(event);

  if (!syncInitPromise) {
    syncInitPromise = db.initSupabaseSync().catch((err) => {
      syncInitPromise = null;
      throw err;
    });
  }
  await syncInitPromise;

  const response = await expressHandler(event, context);
  await db.flushPendingSync();
  return response;
};

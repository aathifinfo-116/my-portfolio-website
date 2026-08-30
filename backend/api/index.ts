import type { IncomingMessage, ServerResponse } from 'http';
import type { Express } from 'express';
import { createApp } from '../src/bootstrap';

/**
 * Vercel serverless entry point.
 *
 * A warm Lambda reuses its module scope between invocations, so the Nest
 * application — and with it the TypeORM connection pool — is built once and
 * cached. Rebuilding per request would open a new pool every time and exhaust
 * the database's connection limit within seconds.
 *
 * The in-flight promise is cached rather than the resolved app so that
 * concurrent cold-start requests share a single initialisation instead of
 * racing to create several.
 */
let appPromise: Promise<Express> | null = null;

async function getServer(): Promise<Express> {
  const app = await createApp();
  await app.init();
  return app.getHttpAdapter().getInstance() as Express;
}

export default async function handler(
  req: IncomingMessage,
  res: ServerResponse,
): Promise<void> {
  if (!appPromise) {
    appPromise = getServer().catch((error) => {
      // Clear the cache on failure so the next request retries instead of
      // permanently serving a rejected promise from this warm instance.
      appPromise = null;
      throw error;
    });
  }

  const server = await appPromise;
  server(req as never, res as never);
}

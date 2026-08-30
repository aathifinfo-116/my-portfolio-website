import type { IncomingMessage, ServerResponse } from 'http';

type ExpressLike = (req: IncomingMessage, res: ServerResponse) => void;

/**
 * A warm Lambda reuses module scope between invocations, so the Nest
 * application — and with it the TypeORM connection pool — is built once and
 * cached. Rebuilding per request would open a new pool every time and exhaust
 * the database's connection limit within seconds.
 *
 * The in-flight promise is cached rather than the resolved app so that
 * concurrent cold-start requests share a single initialisation instead of
 * racing to create several.
 */
let appPromise: Promise<ExpressLike> | null = null;

async function getServer(): Promise<ExpressLike> {
  // Required from dist/, NOT src/, and lazily rather than at module scope.
  //
  // dist/ because @vercel/node compiles TypeScript with esbuild, which does
  // not support `emitDecoratorMetadata`. NestJS dependency injection and
  // TypeORM entities are built entirely on that metadata, so letting esbuild
  // compile the decorated source produces "Nest can't resolve dependencies"
  // at runtime. vercel.json runs `nest build` (tsc, which does emit it) first.
  //
  // Lazily because a failed require at module scope kills the whole module
  // before the error handling below can report why.
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { createApp } = require('../dist/bootstrap');

  const app = await createApp();
  await app.init();
  return app.getHttpAdapter().getInstance() as ExpressLike;
}

export default async function handler(
  req: IncomingMessage,
  res: ServerResponse,
): Promise<void> {
  try {
    if (!appPromise) {
      appPromise = getServer().catch((error: unknown) => {
        // Clear the cache on failure so the next request retries rather than
        // permanently serving a rejected promise from this warm instance.
        appPromise = null;
        throw error;
      });
    }

    const server = await appPromise;
    server(req, res);
  } catch (error: unknown) {
    // Without this the platform reports only FUNCTION_INVOCATION_FAILED and
    // the cause stays buried. This writes the real stack to the runtime log.
    console.error('[boot] Nest failed to start:', error);

    if (res.headersSent) {
      res.destroy();
      return;
    }

    const detail =
      process.env.DEBUG_BOOT === '1' && error instanceof Error
        ? error.message
        : 'Check the deployment runtime logs for the cause.';

    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ statusCode: 500, error: 'Boot failure', message: detail }));
  }
}

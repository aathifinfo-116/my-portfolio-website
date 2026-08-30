import type { IncomingMessage, ServerResponse } from 'http';

// Imported from dist/, NOT src/, and that is deliberate.
//
// @vercel/node compiles TypeScript with esbuild, which does not support
// `emitDecoratorMetadata`. NestJS dependency injection and TypeORM entities
// are built entirely on that metadata, so letting esbuild compile the
// decorated source produces "Nest can't resolve dependencies" at runtime.
//
// vercel.json runs `nest build` (tsc, which does emit the metadata) first,
// and this file imports the compiled output. This file itself contains no
// decorators, so esbuild handles it without trouble.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { createApp } = require('../dist/bootstrap');

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
  const app = await createApp();
  await app.init();
  return app.getHttpAdapter().getInstance() as ExpressLike;
}

export default async function handler(
  req: IncomingMessage,
  res: ServerResponse,
): Promise<void> {
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
}

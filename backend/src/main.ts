import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createApp } from './bootstrap';

/**
 * Local development entry point.
 *
 * Vercel does NOT use this file — it invokes api/index.ts, which shares the
 * same createApp() configuration. Keeping the listener out of the shared
 * factory is what lets the serverless handler reuse it safely.
 */
async function start() {
  const app = await createApp();
  const config = app.get(ConfigService);
  const logger = new Logger('Bootstrap');

  const port = config.get<number>('app.port', 4000);
  const apiPrefix = config.get<string>('app.apiPrefix', 'api');

  app.enableShutdownHooks();

  await app.listen(port);
  logger.log(`API ready on http://localhost:${port}/${apiPrefix}`);
  logger.log(`Swagger docs on http://localhost:${port}/${apiPrefix}/docs`);
}

void start();

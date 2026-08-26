import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { SeedService } from './seed.service';

/**
 * Standalone entry point for `npm run seed`.
 * Boots the DI container without starting an HTTP listener.
 */
async function runSeed() {
  const logger = new Logger('Seed');
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['log', 'warn', 'error'],
  });

  try {
    await app.get(SeedService).run();
  } catch (error) {
    logger.error('Seed failed', error as Error);
    process.exitCode = 1;
  } finally {
    await app.close();
  }
}

void runSeed();

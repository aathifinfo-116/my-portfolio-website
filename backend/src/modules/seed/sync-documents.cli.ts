import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { DocumentSyncService } from '../documents/document-sync.service';

/**
 * Standalone entry point for `npm run sync:documents`.
 * Reconciles the documents table with uploads/documents without reseeding.
 */
async function runSync() {
  const logger = new Logger('SyncDocuments');
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['log', 'warn', 'error', 'debug'],
  });

  try {
    // `npm run sync:documents -- --prune` deletes rows whose file is gone.
    const prune = process.argv.includes('--prune');
    const report = await app.get(DocumentSyncService).sync({ prune });

    logger.log('--- Sync report ---');
    logger.log(`  files scanned : ${report.scannedFiles}`);
    logger.log(`  rows created  : ${report.created}`);
    logger.log(`  rows updated  : ${report.updated}`);
    logger.log(`  rows unchanged: ${report.unchanged}`);
    logger.log(`  skipped files : ${report.skippedFiles.length}`);
    logger.log(
      `  missing files : ${report.missingOnDisk.length}` +
        (prune ? ' (deleted)' : ' (unpublished)'),
    );
  } catch (error) {
    logger.error('Sync failed', error as Error);
    process.exitCode = 1;
  } finally {
    await app.close();
  }
}

void runSync();

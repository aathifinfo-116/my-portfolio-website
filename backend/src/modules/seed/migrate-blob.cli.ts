import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { put } from '@vercel/blob';
import { promises as fs } from 'fs';
import * as path from 'path';
import { DataSource } from 'typeorm';
import { AppModule } from '../../app.module';

/**
 * Uploads everything under uploads/ to Vercel Blob and repoints the database
 * columns that hold those URLs.
 *
 * `npm run migrate:blob`            reports what it would do, changes nothing
 * `npm run migrate:blob -- --apply` uploads and writes the new URLs
 *
 * Dry run is the default deliberately: this rewrites rows in whatever database
 * DATABASE_URL/DB_HOST points at, which for this project is the shared Aiven
 * instance, and there is no undo.
 *
 * Re-running is safe. Blob pathnames mirror the folder layout under uploads/,
 * uploads use allowOverwrite, and rows already pointing at a blob URL are left
 * alone.
 */

/** Content types Blob should serve these files as. */
const MIME_BY_EXTENSION: Record<string, string> = {
  '.pdf': 'application/pdf',
  '.doc': 'application/msword',
  '.docx':
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.ppt': 'application/vnd.ms-powerpoint',
  '.pptx':
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.svg': 'image/svg+xml',
};

/**
 * Columns holding a URL this project issued. Purely external links
 * (githubUrl, liveUrl, credentialUrl) are deliberately absent — rewriting
 * those would corrupt real data.
 */
const URL_COLUMNS: { table: string; columns: string[] }[] = [
  { table: 'profile', columns: ['avatarUrl', 'resumeUrl'] },
  { table: 'documents', columns: ['fileUrl'] },
  { table: 'projects', columns: ['imageUrl'] },
  { table: 'certifications', columns: ['documentUrl', 'badgeUrl'] },
  { table: 'awards', columns: ['imageUrl'] },
];

/** Every file under `dir`, as paths relative to it, using / separators. */
async function walk(dir: string, base = dir): Promise<string[]> {
  const entries = await fs.readdir(dir, { withFileTypes: true });

  const nested = await Promise.all(
    entries.map(async (entry) => {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) return walk(full, base);
      // .gitkeep and friends exist only to keep empty folders in git; object
      // storage has no folders, so uploading them achieves nothing.
      if (entry.name.startsWith('.')) return [];
      return [path.relative(base, full).split(path.sep).join('/')];
    }),
  );

  return nested.flat();
}

async function migrate() {
  const logger = new Logger('MigrateBlob');
  const apply = process.argv.includes('--apply');

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    logger.error(
      'BLOB_READ_WRITE_TOKEN is not set. Get it from the Vercel dashboard ' +
        '(Storage → your store → Connect to Project → "Add a read-write ' +
        'token"), or run `vercel link && vercel env pull .env.vercel`.',
    );
    process.exitCode = 1;
    return;
  }

  const uploadDir = path.resolve(process.env.UPLOAD_DIR ?? './uploads');
  // Must match StorageService's prefix, or files land beside the ones the
  // running app writes rather than in the same tree.
  const prefix = (process.env.BLOB_PATH_PREFIX ?? 'uploads').replace(
    /^\/+|\/+$/g,
    '',
  );
  const blobPath = (relative: string) =>
    prefix ? `${prefix}/${relative}` : relative;
  const app = await NestFactory.createApplicationContext(AppModule, {
    // 'log' must be present or this script's own report is suppressed;
    // 'debug'/'verbose' are left out to keep TypeORM quiet.
    logger: ['log', 'warn', 'error'],
  });

  try {
    const files = await walk(uploadDir);
    logger.log(`Found ${files.length} files under ${uploadDir}`);
    logger.log(
      `Blob pathnames will be prefixed with "${prefix || '(none)'}"` +
        ' — set BLOB_PATH_PREFIX to change it.',
    );

    if (!apply) {
      logger.warn('DRY RUN — nothing will be uploaded or written.');
      logger.warn('Re-run with `-- --apply` to perform the migration.');
    }

    // relative path under uploads/ -> public blob URL
    const uploaded = new Map<string, string>();
    let totalBytes = 0;
    let failed = 0;

    for (const relative of files) {
      const absolute = path.join(uploadDir, ...relative.split('/'));
      const { size } = await fs.stat(absolute);
      const contentType =
        MIME_BY_EXTENSION[path.extname(relative).toLowerCase()] ??
        'application/octet-stream';

      if (!apply) {
        logger.log(
          `  would upload  ${blobPath(relative)}  (${size} bytes, ${contentType})`,
        );
        totalBytes += size;
        continue;
      }

      try {
        const blob = await put(blobPath(relative), await fs.readFile(absolute), {
          access: 'public',
          contentType,
          // Pathnames must mirror uploads/ exactly so a re-run overwrites the
          // same object instead of accumulating suffixed duplicates.
          addRandomSuffix: false,
          allowOverwrite: true,
        });
        uploaded.set(relative, blob.url);
        totalBytes += size;
        logger.log(`  uploaded  ${blobPath(relative)}`);
      } catch (error) {
        failed += 1;
        logger.error(`  FAILED    ${relative}: ${(error as Error).message}`);
      }
    }

    logger.log(
      `${apply ? 'Uploaded' : 'Would upload'} ` +
        `${apply ? uploaded.size : files.length} files, ` +
        `${(totalBytes / 1024 / 1024).toFixed(1)} MB` +
        (failed ? `, ${failed} failed` : ''),
    );

    if (failed > 0 && apply) {
      logger.error('Aborting before touching the database: some uploads failed.');
      logger.error('Fix the cause and re-run; already-uploaded files are reused.');
      process.exitCode = 1;
      return;
    }

    // ---- Repoint the database ----
    const dataSource = app.get(DataSource);
    let rewritten = 0;
    let unmatched = 0;

    for (const { table, columns } of URL_COLUMNS) {
      for (const column of columns) {
        const rows: { id: string; value: string }[] = await dataSource.query(
          `SELECT id, "${column}" AS value FROM "${table}" WHERE "${column}" LIKE '%/static/%'`,
        );

        for (const row of rows) {
          // Stored URLs are absolute and percent-encoded per segment; the map
          // is keyed on the decoded path relative to uploads/.
          const encoded = row.value.split('/static/')[1];
          if (!encoded) continue;

          let relative: string;
          try {
            relative = encoded
              .split('/')
              .map((segment) => decodeURIComponent(segment))
              .join('/');
          } catch {
            logger.warn(`  ${table}.${column} ${row.id}: malformed URL, skipped`);
            unmatched += 1;
            continue;
          }

          const blobUrl = apply ? uploaded.get(relative) : undefined;

          if (!apply) {
            logger.log(`  would repoint  ${table}.${column}  ${relative}`);
            rewritten += 1;
            continue;
          }

          if (!blobUrl) {
            logger.warn(
              `  ${table}.${column} ${row.id}: no uploaded file for "${relative}" — left unchanged`,
            );
            unmatched += 1;
            continue;
          }

          await dataSource.query(
            `UPDATE "${table}" SET "${column}" = $1 WHERE id = $2`,
            [blobUrl, row.id],
          );
          rewritten += 1;
        }
      }
    }

    logger.log(
      `${apply ? 'Repointed' : 'Would repoint'} ${rewritten} column values` +
        (unmatched ? `, ${unmatched} left unchanged` : ''),
    );

    if (apply) {
      logger.log('Done. Set STORAGE_DRIVER=vercel-blob so new uploads go to Blob.');
    }
  } catch (error) {
    logger.error('Migration failed', error as Error);
    process.exitCode = 1;
  } finally {
    await app.close();
  }
}

void migrate();

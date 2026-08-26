import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { promises as fs } from 'fs';
import * as path from 'path';
import { Repository } from 'typeorm';
import {
  Document,
  DocumentDomain,
  DocumentFileType,
  EXTENSION_FILE_TYPE,
} from './entities/document.entity';

/** Canonical MIME type per extension, used when reconciling from disk. */
const EXTENSION_MIME: Record<string, string> = {
  '.pdf': 'application/pdf',
  '.doc': 'application/msword',
  '.docx':
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.ppt': 'application/vnd.ms-powerpoint',
  '.pptx':
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
};

/**
 * Folder name -> domain. Lower-cased directory names map onto the enum's
 * display casing, so `devops/` becomes "DevOps" rather than "Devops".
 */
const FOLDER_DOMAIN: Record<string, DocumentDomain> = {
  development: DocumentDomain.DEVELOPMENT,
  cloud: DocumentDomain.CLOUD,
  devops: DocumentDomain.DEVOPS,
  ai: DocumentDomain.AI,
  management: DocumentDomain.MANAGEMENT,
  research: DocumentDomain.RESEARCH,
  other: DocumentDomain.OTHER,
};

interface ScannedFile {
  /** Path relative to uploads/documents, POSIX separators. e.g. "devops/a.pdf" */
  relativePath: string;
  absolutePath: string;
  fileName: string;
  domain: DocumentDomain;
  fileType: DocumentFileType;
  mimeType: string;
  sizeBytes: number;
  title: string;
  /** Leading "10. " in a filename becomes sortOrder 10. */
  sortOrder: number;
  modifiedAt: Date;
}

export interface SyncReport {
  scannedFiles: number;
  created: number;
  updated: number;
  unchanged: number;
  /** Rows whose file is no longer on disk. Unpublished, never deleted. */
  missingOnDisk: Array<{ id: string; title: string; expectedFile: string }>;
  /** Files present but skipped because the extension is not a document type. */
  skippedFiles: string[];
  changes: Array<{ title: string; field: string; from: unknown; to: unknown }>;
}

/**
 * Walks uploads/documents recursively and mirrors it into the documents table.
 *
 * The first path segment under uploads/documents is the domain, so
 * `devops/guide.pdf` is filed under DevOps. Records are keyed by that relative
 * path, which means a file can be renamed in place and re-imported cleanly.
 *
 * Rows whose file has disappeared are unpublished and reported rather than
 * deleted - the descriptions on those rows are hand-written and worth keeping.
 * Pass `prune` to remove them outright.
 */
@Injectable()
export class DocumentSyncService {
  private readonly logger = new Logger(DocumentSyncService.name);

  constructor(
    @InjectRepository(Document)
    private readonly documentRepo: Repository<Document>,
    private readonly config: ConfigService,
  ) {}

  private get documentsDir(): string {
    return path.resolve(
      this.config.get<string>('storage.uploadDir', './uploads'),
      'documents',
    );
  }

  private get publicBaseUrl(): string {
    return this.config
      .get<string>('app.publicBaseUrl', 'http://localhost:4000')
      .replace(/\/$/, '');
  }

  /**
   * Public URL for a relative path. Each segment is encoded individually so
   * spaces survive but the separators stay intact.
   */
  buildFileUrl(relativePath: string): string {
    const encoded = relativePath
      .split('/')
      .map((segment) => encodeURIComponent(segment))
      .join('/');
    return `${this.publicBaseUrl}/static/documents/${encoded}`;
  }

  async sync(options: { prune?: boolean } = {}): Promise<SyncReport> {
    const report: SyncReport = {
      scannedFiles: 0,
      created: 0,
      updated: 0,
      unchanged: 0,
      missingOnDisk: [],
      skippedFiles: [],
      changes: [],
    };

    const root = this.documentsDir;

    try {
      await fs.access(root);
    } catch {
      this.logger.warn(`Documents directory not found: ${root}`);
      return report;
    }

    const scanned = await this.scan(root, report);
    report.scannedFiles = scanned.length;

    const existing = await this.documentRepo.find();
    const byPath = new Map<string, Document>();
    for (const document of existing) {
      const key = this.relativePathFromUrl(document.fileUrl);
      if (key) byPath.set(key.toLowerCase(), document);
    }

    const seen = new Set<string>();

    for (const file of scanned) {
      seen.add(file.relativePath.toLowerCase());
      const match = byPath.get(file.relativePath.toLowerCase());

      const next = {
        domain: file.domain,
        fileType: file.fileType,
        fileUrl: this.buildFileUrl(file.relativePath),
        fileName: file.fileName,
        fileSizeBytes: file.sizeBytes,
        mimeType: file.mimeType,
      };

      if (!match) {
        await this.documentRepo.save(
          this.documentRepo.create({
            ...next,
            title: file.title,
            topic: this.topicFromDomain(file.domain),
            sortOrder: file.sortOrder,
            uploadedAt: file.modifiedAt,
            isPublished: true,
          }),
        );
        report.created += 1;
        this.logger.log(`  + ${file.relativePath}`);
        continue;
      }

      // Only overwrite file-derived columns. Title and description may have
      // been edited in the dashboard, so they are left alone on update.
      const diff = (Object.keys(next) as Array<keyof typeof next>).filter(
        (key) => match[key] !== next[key],
      );

      // Re-publish a row whose file has come back.
      const republish = !match.isPublished;

      if (diff.length === 0 && !republish) {
        report.unchanged += 1;
        continue;
      }

      for (const field of diff) {
        report.changes.push({
          title: match.title,
          field,
          from: match[field],
          to: next[field],
        });
      }

      await this.documentRepo.update(match.id, {
        ...next,
        ...(republish ? { isPublished: true } : {}),
      });
      report.updated += 1;
    }

    // Anything in the table with no corresponding file.
    for (const [key, document] of byPath) {
      if (seen.has(key)) continue;

      report.missingOnDisk.push({
        id: document.id,
        title: document.title,
        expectedFile: key,
      });

      if (options.prune) {
        await this.documentRepo.remove(document);
      } else if (document.isPublished) {
        // Hide from the public site without destroying the record.
        await this.documentRepo.update(document.id, { isPublished: false });
      }
    }

    this.logSummary(report, options.prune ?? false);
    return report;
  }

  /** Depth-first walk; the first segment under the root selects the domain. */
  private async scan(
    root: string,
    report: SyncReport,
    current = root,
  ): Promise<ScannedFile[]> {
    const results: ScannedFile[] = [];
    const entries = await fs.readdir(current, { withFileTypes: true });

    for (const entry of entries) {
      const absolutePath = path.join(current, entry.name);

      if (entry.isDirectory()) {
        results.push(...(await this.scan(root, report, absolutePath)));
        continue;
      }

      if (entry.name.startsWith('.')) continue;

      const relativePath = path
        .relative(root, absolutePath)
        .split(path.sep)
        .join('/');

      const extension = path.extname(entry.name).toLowerCase();
      const fileType = EXTENSION_FILE_TYPE[extension];

      if (!fileType) {
        report.skippedFiles.push(relativePath);
        continue;
      }

      const segments = relativePath.split('/');
      const folder = segments.length > 1 ? segments[0].toLowerCase() : '';
      const domain = FOLDER_DOMAIN[folder] ?? DocumentDomain.OTHER;

      const stats = await fs.stat(absolutePath);
      const { title, sortOrder } = this.humanise(entry.name);

      results.push({
        relativePath,
        absolutePath,
        fileName: entry.name,
        domain,
        fileType,
        mimeType: EXTENSION_MIME[extension] ?? 'application/octet-stream',
        sizeBytes: stats.size,
        title,
        sortOrder,
        modifiedAt: stats.mtime,
      });
    }

    return results;
  }

  /**
   * "10. Azure_Fundamentals_Security.docx" -> { title: "Azure Fundamentals
   * Security", sortOrder: 10 }. A numeric prefix is treated as ordering
   * intent rather than part of the name.
   */
  private humanise(fileName: string): { title: string; sortOrder: number } {
    const withoutExtension = fileName.replace(/\.[^.]+$/, '');

    const numbered = withoutExtension.match(/^\s*(\d+)\s*[.)\-_]\s*(.*)$/);
    const sortOrder = numbered ? parseInt(numbered[1], 10) : 0;
    const body = numbered ? numbered[2] : withoutExtension;

    const title = body
      .replace(/[_]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    return { title: title || withoutExtension, sortOrder };
  }

  private topicFromDomain(domain: DocumentDomain): string {
    return domain;
  }

  private relativePathFromUrl(url: string | null | undefined): string | null {
    if (!url) return null;
    const marker = '/static/documents/';
    const index = url.indexOf(marker);
    if (index === -1) return null;
    return decodeURIComponent(url.slice(index + marker.length));
  }

  private logSummary(report: SyncReport, pruned: boolean) {
    this.logger.log(
      `Scanned ${report.scannedFiles} file(s): ${report.created} created, ` +
        `${report.updated} updated, ${report.unchanged} unchanged.`,
    );

    for (const change of report.changes) {
      this.logger.debug(
        `  ${change.title}: ${change.field} ${String(change.from)} -> ${String(change.to)}`,
      );
    }

    for (const skipped of report.skippedFiles) {
      this.logger.warn(`  Skipped (unsupported type): ${skipped}`);
    }

    for (const missing of report.missingOnDisk) {
      this.logger.warn(
        `  ${pruned ? 'Deleted' : 'Unpublished'} - file gone: ${missing.expectedFile}`,
      );
    }
  }
}

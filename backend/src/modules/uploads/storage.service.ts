import {
  BadRequestException,
  Injectable,
  Logger,
  PayloadTooLargeException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { del, put } from '@vercel/blob';
import { randomUUID } from 'crypto';
import { promises as fs } from 'fs';
import * as path from 'path';

export interface StoredFile {
  url: string;
  /** Name the client sent, kept for display and download prompts. */
  originalName: string;
  /** Name actually written to disk (sanitised, de-duplicated). */
  storedName: string;
  size: number;
  mimeType: string;
}

/** Folders each upload kind targets, relative to uploads/. */
export const UPLOAD_TARGETS = {
  avatar: ['images', 'avatar'],
  projectImage: ['images', 'featuredproject'],
  badge: ['images', 'badges'],
  awardImage: ['images', 'awards'],
  // Deliberately outside uploads/documents so the document scanner,
  // which imports everything under that tree, never picks the CV up.
  resume: ['resume'],
} as const;

const ALLOWED_DOCUMENT_MIME = ['application/pdf'];

/** PDF plus the legacy and OOXML Word/PowerPoint types. */
const ALLOWED_STUDY_MATERIAL_MIME = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
];
const ALLOWED_IMAGE_MIME = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/avif',
  'image/svg+xml',
];

/** Host suffix every public Vercel Blob URL ends with. */
const BLOB_HOST_SUFFIX = '.public.blob.vercel-storage.com';

/** True for a URL served by Vercel Blob rather than by our own /static route. */
export function isBlobUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  try {
    return new URL(url).hostname.endsWith(BLOB_HOST_SUFFIX);
  } catch {
    return false;
  }
}

/**
 * Storage with a driver-shaped API.
 *
 * `local` writes under uploads/ and hands out /static URLs; `vercel-blob`
 * uploads to Vercel Blob and hands out its absolute public URLs. Both are
 * reached through the same saveX/removeByUrl surface, so no caller changes
 * when STORAGE_DRIVER changes.
 *
 * The blob driver exists because serverless filesystems are read-only and
 * ephemeral: on Vercel the local driver cannot store anything that survives
 * the request.
 */
@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly uploadDir: string;
  private readonly publicBaseUrl: string;
  private readonly maxBytes: number;
  private readonly driver: string;
  private readonly blobPrefix: string;

  constructor(private readonly config: ConfigService) {
    this.driver = this.config.get<string>('storage.driver', 'local');
    this.blobPrefix = this.config.get<string>('storage.blobPrefix', 'uploads');
    this.uploadDir = path.resolve(
      this.config.get<string>('storage.uploadDir', './uploads'),
    );
    this.publicBaseUrl = this.config
      .get<string>('app.publicBaseUrl', 'http://localhost:4000')
      .replace(/\/$/, '');
    this.maxBytes = this.config.get<number>(
      'storage.maxUploadBytes',
      10 * 1024 * 1024,
    );
  }

  saveDocument(file: Express.Multer.File): Promise<StoredFile> {
    return this.persist(file, 'documents', ALLOWED_DOCUMENT_MIME);
  }

  saveImage(file: Express.Multer.File): Promise<StoredFile> {
    return this.persist(file, 'images', ALLOWED_IMAGE_MIME);
  }

  saveAvatar(file: Express.Multer.File): Promise<StoredFile> {
    return this.saveTo(file, [...UPLOAD_TARGETS.avatar], {
      allowedMime: ALLOWED_IMAGE_MIME,
      keepName: true,
    });
  }

  /** Kept under its own name so title-based project matching keeps working. */
  saveProjectImage(file: Express.Multer.File): Promise<StoredFile> {
    return this.saveTo(file, [...UPLOAD_TARGETS.projectImage], {
      allowedMime: ALLOWED_IMAGE_MIME,
      keepName: true,
    });
  }

  saveBadge(file: Express.Multer.File): Promise<StoredFile> {
    return this.saveTo(file, [...UPLOAD_TARGETS.badge], {
      allowedMime: ALLOWED_IMAGE_MIME,
    });
  }

  saveAwardImage(file: Express.Multer.File): Promise<StoredFile> {
    return this.saveTo(file, [...UPLOAD_TARGETS.awardImage], {
      allowedMime: ALLOWED_IMAGE_MIME,
    });
  }

  saveResume(file: Express.Multer.File): Promise<StoredFile> {
    return this.saveTo(file, [...UPLOAD_TARGETS.resume], {
      allowedMime: ALLOWED_DOCUMENT_MIME,
      keepName: true,
    });
  }

  /**
   * Study material filed under its domain folder, e.g. documents/devops.
   * The name is preserved so DocumentSyncService can derive a readable title.
   */
  saveStudyMaterialForDomain(
    file: Express.Multer.File,
    domainFolder: string,
  ): Promise<StoredFile> {
    return this.saveTo(file, ['documents', domainFolder], {
      allowedMime: ALLOWED_STUDY_MATERIAL_MIME,
      keepName: true,
    });
  }

  /** Study materials additionally accept Word and PowerPoint. */
  saveStudyMaterial(file: Express.Multer.File): Promise<StoredFile> {
    return this.persist(file, 'documents', ALLOWED_STUDY_MATERIAL_MIME);
  }

  /**
   * Maps a public /static URL back to its path on disk, for endpoints that
   * stream the file themselves. Returns null if the URL escapes the upload
   * directory or is not one of ours.
   */
  resolveStoredPath(url: string | null | undefined): string | null {
    if (!url || !url.includes('/static/')) return null;

    const relative = url.split('/static/')[1];
    if (!relative) return null;

    // Stored URLs are percent-encoded per segment, so "a/JAVA%20Notes.pdf"
    // has to be decoded before it can match a real path on disk.
    let decoded: string;
    try {
      decoded = relative
        .split('/')
        .map((segment) => decodeURIComponent(segment))
        .join(path.sep);
    } catch {
      this.logger.warn(`Malformed encoding in stored URL: ${url}`);
      return null;
    }

    const absolutePath = path.resolve(this.uploadDir, decoded);
    if (!absolutePath.startsWith(this.uploadDir)) {
      this.logger.warn(`Refused to resolve outside upload dir: ${url}`);
      return null;
    }
    return absolutePath;
  }

  /**
   * Saves into an arbitrary folder under uploads/, e.g. ['images','avatar'].
   *
   * `keepName` preserves a sanitised original filename instead of a UUID. The
   * sync services key on filenames (document titles, project-image matching),
   * so readable names matter there; opaque names are safer everywhere else.
   */
  async saveTo(
    file: Express.Multer.File,
    segments: string[],
    options: { allowedMime: string[]; keepName?: boolean },
  ): Promise<StoredFile> {
    if (!file) {
      throw new BadRequestException('No file was uploaded.');
    }

    if (!options.allowedMime.includes(file.mimetype)) {
      throw new BadRequestException(
        `Unsupported file type "${file.mimetype}". Allowed: ${options.allowedMime.join(', ')}.`,
      );
    }

    if (file.size > this.maxBytes) {
      throw new PayloadTooLargeException(
        `File exceeds the ${Math.round(this.maxBytes / 1024 / 1024)}MB limit.`,
      );
    }

    // Reject any segment that could climb out of the upload directory.
    const safeSegments = segments.map((segment) => {
      const cleaned = segment.replace(/[^a-zA-Z0-9._-]/g, '');
      if (!cleaned || cleaned.includes('..')) {
        throw new BadRequestException(`Invalid upload folder: "${segment}"`);
      }
      return cleaned;
    });

    if (this.driver === 'vercel-blob') {
      return this.putBlob(file, safeSegments, options.keepName === true);
    }

    // Vercel functions run on a read-only, ephemeral filesystem. Writing
    // would throw EROFS, or succeed into /tmp and vanish on the next cold
    // start, leaving a database row pointing at nothing.
    if (process.env.VERCEL) {
      throw new ServiceUnavailableException(
        'File uploads are disabled on this deployment: serverless storage is ' +
          'ephemeral. Set STORAGE_DRIVER=vercel-blob (or configure S3 / ' +
          'Cloudinary) to enable uploads in production.',
      );
    }

    const targetDir = path.join(this.uploadDir, ...safeSegments);
    await fs.mkdir(targetDir, { recursive: true });

    const extension = path.extname(file.originalname).toLowerCase().slice(0, 10);
    const storedName = options.keepName
      ? await this.uniqueName(targetDir, file.originalname)
      : `${randomUUID()}${extension}`;

    await fs.writeFile(path.join(targetDir, storedName), file.buffer);

    const urlPath = [...safeSegments, storedName]
      .map((segment) => encodeURIComponent(segment))
      .join('/');

    return {
      url: `${this.publicBaseUrl}/static/${urlPath}`,
      originalName: path.basename(file.originalname),
      storedName,
      size: file.size,
      mimeType: file.mimetype,
    };
  }

  /**
   * Uploads to Vercel Blob under the same folder layout the local driver
   * uses, so a store migrated from uploads/ keeps identical pathnames.
   *
   * `addRandomSuffix` is the blob equivalent of uniqueName(): without it a
   * repeat upload of the same name would need allowOverwrite and would
   * silently replace the earlier file. It is switched off for keepName
   * uploads, where the sync services match on the filename itself — those
   * pass allowOverwrite instead, since replacing is the intent there.
   */
  private async putBlob(
    file: Express.Multer.File,
    segments: string[],
    keepName: boolean,
  ): Promise<StoredFile> {
    const base = path.basename(file.originalname);
    const extension = path.extname(base).toLowerCase().slice(0, 10);
    const name = keepName ? base : `${randomUUID()}${extension}`;
    // Prefixed so the blob store mirrors the local uploads/ tree exactly:
    // uploads/documents/devops/x.pdf in both places.
    const pathname = [...(this.blobPrefix ? [this.blobPrefix] : []), ...segments, name].join('/');

    let blob: Awaited<ReturnType<typeof put>>;
    try {
      blob = await put(pathname, file.buffer, {
        access: 'public',
        contentType: file.mimetype,
        addRandomSuffix: !keepName,
        allowOverwrite: keepName,
      });
    } catch (error) {
      const message = (error as Error).message ?? '';
      this.logger.error(`Blob upload failed for "${pathname}": ${message}`);

      // The SDK's credential error is the single most likely failure here and
      // reads as a bare 500 in the admin portal otherwise. A "public" store is
      // not the same as an unauthenticated one: public governs read access to
      // the stored files, never the right to write them.
      if (message.includes('No blob credentials found')) {
        throw new ServiceUnavailableException(
          'Blob storage is not authenticated: BLOB_READ_WRITE_TOKEN is ' +
            'missing. In Vercel → Storage → your Blob store → Settings, click ' +
            '"Restore Read-Write Token" (the connect dialog stops offering it ' +
            'once the token has been revoked), then redeploy.',
        );
      }

      throw new ServiceUnavailableException(
        `Blob storage rejected the upload: ${message}`,
      );
    }

    return {
      url: blob.url,
      originalName: base,
      storedName: path.basename(new URL(blob.url).pathname),
      size: file.size,
      mimeType: file.mimetype,
    };
  }

  /**
   * Sanitises the client filename and appends -1, -2 … until it is free.
   * Path separators are stripped, so the name can never redirect the write.
   */
  private async uniqueName(dir: string, originalName: string): Promise<string> {
    const base = path.basename(originalName);
    const extension = path.extname(base);
    const stem =
      base
        .slice(0, base.length - extension.length)
        // eslint-disable-next-line no-control-regex
        .replace(/[<>:"/\\|?*\x00-\x1F]/g, '')
        .trim() || 'file';

    let candidate = `${stem}${extension}`;
    let counter = 1;

    // Bounded so a pathological directory cannot spin here forever.
    while (counter < 1000) {
      try {
        await fs.access(path.join(dir, candidate));
        candidate = `${stem}-${counter}${extension}`;
        counter += 1;
      } catch {
        return candidate;
      }
    }

    return `${stem}-${randomUUID()}${extension}`;
  }

  private persist(
    file: Express.Multer.File,
    folder: 'documents' | 'images',
    allowedMime: string[],
  ): Promise<StoredFile> {
    return this.saveTo(file, [folder], { allowedMime });
  }

  /**
   * Deletes a previously stored file given the public URL we handed out.
   * Missing files are ignored - a failed cleanup must never break the request.
   */
  async removeByUrl(url: string | null | undefined): Promise<void> {
    if (isBlobUrl(url)) {
      try {
        await del(url as string);
      } catch (error) {
        this.logger.warn(
          `Could not delete blob ${url as string}: ${(error as Error).message}`,
        );
      }
      return;
    }

    // Shares resolveStoredPath so percent-encoded names (spaces, ampersands)
    // decode identically here and in the download path. Resolving separately
    // is how deletes silently orphaned every file with a space in its name.
    const absolutePath = this.resolveStoredPath(url);
    if (!absolutePath) return;

    try {
      await fs.unlink(absolutePath);
    } catch (error) {
      const err = error as NodeJS.ErrnoException;
      if (err.code !== 'ENOENT') {
        this.logger.warn(`Could not delete ${absolutePath}: ${err.message}`);
      }
    }
  }
}

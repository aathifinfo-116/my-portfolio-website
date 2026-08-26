import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { constants as fsConstants } from 'fs';
import { promises as fs } from 'fs';
import * as path from 'path';
import { Brackets, Repository } from 'typeorm';
import {
  DEFAULT_PAGE_SIZE,
  PaginatedResult,
  paginate,
} from '../../common/dto/pagination-query.dto';
import { StorageService, StoredFile } from '../uploads/storage.service';
import { DOMAIN_FOLDER } from '../uploads/uploads.controller';
import {
  CreateDocumentDto,
  QueryDocumentsDto,
  UpdateDocumentDto,
} from './dto/document.dto';
import {
  Document,
  DocumentDomain,
  DocumentFileType,
  EXTENSION_FILE_TYPE,
} from './entities/document.entity';

/** Extension -> MIME, mirroring the sync service. */
const EXTENSION_MIME: Record<string, string> = {
  '.pdf': 'application/pdf',
  '.doc': 'application/msword',
  '.docx':
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.ppt': 'application/vnd.ms-powerpoint',
  '.pptx':
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
};

@Injectable()
export class DocumentsService {
  constructor(
    @InjectRepository(Document)
    private readonly documentRepo: Repository<Document>,
    private readonly storage: StorageService,
  ) {}

  async findAll(
    query: QueryDocumentsDto,
    opts: { publicOnly: boolean },
  ): Promise<PaginatedResult<Document>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? DEFAULT_PAGE_SIZE;

    const qb = this.documentRepo.createQueryBuilder('doc');

    if (opts.publicOnly || !query.includeUnpublished) {
      qb.andWhere('doc.isPublished = :published', { published: true });
    }

    // The two filter rows are independent and combine with AND.
    if (query.domain) {
      qb.andWhere('doc.domain = :domain', { domain: query.domain });
    }

    if (query.fileType) {
      qb.andWhere('doc.fileType = :fileType', { fileType: query.fileType });
    }

    if (query.search) {
      const term = `%${query.search.toLowerCase()}%`;
      qb.andWhere(
        new Brackets((w) => {
          w.where('LOWER(doc.title) LIKE :term', { term })
            .orWhere('LOWER(doc.description) LIKE :term', { term })
            .orWhere('LOWER(doc.topic) LIKE :term', { term });
        }),
      );
    }

    qb.orderBy('doc.sortOrder', 'ASC')
      .addOrderBy('doc.uploadedAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [items, total] = await qb.getManyAndCount();
    return paginate(items, total, page, limit);
  }

  /** Counts for both filter rows, so chips can show totals. */
  async facets() {
    const rows = await this.documentRepo
      .createQueryBuilder('doc')
      .select('doc.domain', 'domain')
      .addSelect('doc.fileType', 'fileType')
      .addSelect('COUNT(*)', 'count')
      .where('doc.isPublished = true')
      .groupBy('doc.domain')
      .addGroupBy('doc.fileType')
      .getRawMany<{ domain: string; fileType: string; count: string }>();

    const domains: Record<string, number> = {};
    const fileTypes: Record<string, number> = {};
    let total = 0;

    for (const row of rows) {
      const count = parseInt(row.count, 10);
      domains[row.domain] = (domains[row.domain] ?? 0) + count;
      fileTypes[row.fileType] = (fileTypes[row.fileType] ?? 0) + count;
      total += count;
    }

    domains.All = total;
    fileTypes.All = total;
    return { domains, fileTypes, total };
  }

  async findOne(id: string, opts: { publicOnly: boolean }) {
    const document = await this.documentRepo.findOne({ where: { id } });
    if (!document || (opts.publicOnly && !document.isPublished)) {
      throw new NotFoundException(`Document ${id} not found.`);
    }
    return document;
  }

  /**
   * Resolves the record plus its path on disk for the download endpoint.
   * Throws rather than returning a partial result so the controller stays thin.
   *
   * The existence check matters: streaming a missing path emits an unhandled
   * 'error' event on the ReadStream, which takes the whole process down.
   */
  async resolveForDownload(id: string) {
    const document = await this.findOne(id, { publicOnly: true });
    const absolutePath = this.storage.resolveStoredPath(document.fileUrl);

    if (!absolutePath) {
      throw new NotFoundException('The stored file is no longer available.');
    }

    let actualSize: number;
    try {
      await fs.access(absolutePath, fsConstants.R_OK);
      // Size comes from the file, never from the column: a stale
      // fileSizeBytes would make Content-Length disagree with the body and
      // leave the client waiting for bytes that never arrive.
      const stats = await fs.stat(absolutePath);
      actualSize = stats.size;
    } catch {
      throw new NotFoundException(
        `The file for "${document.title}" has not been uploaded yet.`,
      );
    }

    // Fire-and-forget: a failed counter must not block the download.
    void this.documentRepo.increment({ id }, 'downloadCount', 1).catch(() => undefined);

    return { document, absolutePath, actualSize };
  }

  /**
   * Creates from a fileUrl produced by a prior upload.
   *
   * fileType, fileSizeBytes and mimeType are derived from the file on disk
   * rather than trusted from the client, so the admin form never has to send
   * them and they cannot disagree with reality.
   */
  async create(dto: CreateDocumentDto) {
    if (!dto.fileUrl) {
      throw new BadRequestException(
        'A document requires an uploaded file. Upload it first, then submit the returned fileUrl.',
      );
    }

    const absolutePath = this.storage.resolveStoredPath(dto.fileUrl);
    if (!absolutePath) {
      throw new BadRequestException('fileUrl does not point at stored content.');
    }

    let size: number;
    try {
      const stats = await fs.stat(absolutePath);
      size = stats.size;
    } catch {
      throw new BadRequestException(
        'The uploaded file could not be found on disk.',
      );
    }

    const fileName = dto.fileName ?? path.basename(absolutePath);
    const extension = path.extname(fileName).toLowerCase();
    const fileType = EXTENSION_FILE_TYPE[extension];

    if (!fileType) {
      throw new BadRequestException(
        `Unsupported extension "${extension}". Allowed: ${Object.keys(EXTENSION_FILE_TYPE).join(', ')}.`,
      );
    }

    return this.documentRepo.save(
      this.documentRepo.create({
        ...dto,
        fileName,
        fileType,
        fileSizeBytes: size,
        mimeType: EXTENSION_MIME[extension] ?? null,
        uploadedAt: dto.uploadedAt ? new Date(dto.uploadedAt) : new Date(),
      }),
    );
  }

  /** Creates a record and its file in one multipart request. */
  async createWithFile(dto: CreateDocumentDto, file: Express.Multer.File) {
    // Filed under the domain folder so it matches how the public site groups.
    const stored = await this.storage.saveStudyMaterialForDomain(
      file,
      DOMAIN_FOLDER[dto.domain],
    );

    return this.documentRepo.save(
      this.documentRepo.create({
        ...dto,
        ...this.fileColumns(stored),
        uploadedAt: dto.uploadedAt ? new Date(dto.uploadedAt) : new Date(),
      }),
    );
  }

  async replaceFile(id: string, file: Express.Multer.File) {
    const document = await this.findOne(id, { publicOnly: false });
    const stored = await this.storage.saveStudyMaterialForDomain(
      file,
      DOMAIN_FOLDER[document.domain],
    );

    if (document.fileUrl) {
      await this.storage.removeByUrl(document.fileUrl);
    }

    Object.assign(document, this.fileColumns(stored));
    return this.documentRepo.save(document);
  }

  async update(id: string, dto: UpdateDocumentDto) {
    const existing = await this.findOne(id, { publicOnly: false });
    const merged = await this.documentRepo.preload({
      id: existing.id,
      ...dto,
      ...(dto.uploadedAt ? { uploadedAt: new Date(dto.uploadedAt) } : {}),
    });
    return this.documentRepo.save(merged as Document);
  }

  async remove(id: string) {
    const document = await this.findOne(id, { publicOnly: false });
    await this.storage.removeByUrl(document.fileUrl);
    await this.documentRepo.remove(document);
    return { id, deleted: true as const };
  }

  /** Derives the stored-file columns, including fileType from the extension. */
  private fileColumns(stored: StoredFile) {
    const extension = path.extname(stored.storedName).toLowerCase();
    const fileType = EXTENSION_FILE_TYPE[extension];

    if (!fileType) {
      throw new BadRequestException(
        `Unsupported extension "${extension}". Allowed: ${Object.keys(EXTENSION_FILE_TYPE).join(', ')}.`,
      );
    }

    return {
      fileUrl: stored.url,
      // storedName, not originalName: on a collision the file on disk was
      // renamed, and fileName must match what the URL actually points at.
      fileName: stored.storedName,
      fileSizeBytes: stored.size,
      mimeType: stored.mimeType,
      fileType,
    };
  }

  static readonly DOMAINS = Object.values(DocumentDomain);
  static readonly FILE_TYPES = Object.values(DocumentFileType);
}

import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Repository } from 'typeorm';
import {
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
  PaginatedResult,
  paginate,
} from '../../common/dto/pagination-query.dto';
import { StorageService } from '../uploads/storage.service';
import { CreateCertificationDto } from './dto/create-certification.dto';
import { QueryCertificationsDto } from './dto/query-certifications.dto';
import { UpdateCertificationDto } from './dto/update-certification.dto';
import {
  Certification,
  CertificationCategory,
} from './entities/certification.entity';

@Injectable()
export class CertificationsService {
  constructor(
    @InjectRepository(Certification)
    private readonly certRepo: Repository<Certification>,
    private readonly storage: StorageService,
  ) {}

  async findAll(
    query: QueryCertificationsDto,
    opts: { publicOnly: boolean },
  ): Promise<PaginatedResult<Certification>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? DEFAULT_PAGE_SIZE;

    const qb = this.certRepo.createQueryBuilder('cert');

    if (opts.publicOnly || !query.includeUnpublished) {
      qb.andWhere('cert.isPublished = :published', { published: true });
    }

    if (query.category) {
      qb.andWhere('cert.category = :category', { category: query.category });
    }

    if (query.withDocument) {
      qb.andWhere('cert.documentUrl IS NOT NULL');
    }

    if (query.search) {
      const term = `%${query.search.toLowerCase()}%`;
      qb.andWhere(
        new Brackets((w) => {
          w.where('LOWER(cert.title) LIKE :term', { term }).orWhere(
            'LOWER(cert.institution) LIKE :term',
            { term },
          );
        }),
      );
    }

    qb.orderBy('cert.sortOrder', 'ASC')
      // NULLS LAST keeps undated rows from floating to the top of the timeline.
      .addOrderBy('cert.issuedYear', 'DESC', 'NULLS LAST')
      .addOrderBy('cert.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [items, total] = await qb.getManyAndCount();
    return paginate(items, total, page, limit);
  }

  /**
   * Pre-bucketed by category so the "Studies & Certs" section can render its
   * three groups without the client doing the grouping.
   */
  async findGrouped() {
    const { items } = await this.findAll(
      { limit: MAX_PAGE_SIZE },
      { publicOnly: true },
    );

    const groups = Object.values(CertificationCategory).reduce<
      Record<string, Certification[]>
    >((acc, category) => {
      acc[category] = [];
      return acc;
    }, {});

    for (const item of items) {
      groups[item.category].push(item);
    }

    return { groups, total: items.length };
  }

  async findOne(id: string, opts: { publicOnly: boolean }) {
    const cert = await this.certRepo.findOne({ where: { id } });
    if (!cert || (opts.publicOnly && !cert.isPublished)) {
      throw new NotFoundException(`Certification ${id} not found.`);
    }
    return cert;
  }

  create(dto: CreateCertificationDto) {
    return this.certRepo.save(this.certRepo.create(dto));
  }

  async update(id: string, dto: UpdateCertificationDto) {
    const existing = await this.findOne(id, { publicOnly: false });

    // Swapping in a new document orphans the old file - remove it.
    if (
      dto.documentUrl &&
      existing.documentUrl &&
      dto.documentUrl !== existing.documentUrl
    ) {
      await this.storage.removeByUrl(existing.documentUrl);
    }

    const merged = await this.certRepo.preload({ id: existing.id, ...dto });
    return this.certRepo.save(merged as Certification);
  }

  /** Attaches an uploaded PDF to an existing record. */
  async attachDocument(
    id: string,
    file: { url: string; originalName: string; size: number },
  ) {
    const cert = await this.findOne(id, { publicOnly: false });
    if (cert.documentUrl) {
      await this.storage.removeByUrl(cert.documentUrl);
    }
    cert.documentUrl = file.url;
    cert.documentName = file.originalName;
    cert.documentSizeBytes = file.size;
    return this.certRepo.save(cert);
  }

  async remove(id: string) {
    const cert = await this.findOne(id, { publicOnly: false });
    // Delete the stored files too, otherwise the uploads dir grows forever.
    if (cert.documentUrl) await this.storage.removeByUrl(cert.documentUrl);
    if (cert.badgeUrl) await this.storage.removeByUrl(cert.badgeUrl);
    await this.certRepo.remove(cert);
    return { id, deleted: true as const };
  }
}

import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Repository } from 'typeorm';
import {
  DEFAULT_PAGE_SIZE,
  PaginatedResult,
  paginate,
} from '../../common/dto/pagination-query.dto';
import { CreateProjectDto } from './dto/create-project.dto';
import { QueryProjectsDto } from './dto/query-projects.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { Project } from './entities/project.entity';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectRepository(Project)
    private readonly projectRepo: Repository<Project>,
  ) {}

  async findAll(
    query: QueryProjectsDto,
    opts: { publicOnly: boolean },
  ): Promise<PaginatedResult<Project>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? DEFAULT_PAGE_SIZE;

    const qb = this.projectRepo.createQueryBuilder('project');

    if (opts.publicOnly || !query.includeUnpublished) {
      qb.andWhere('project.isPublished = :published', { published: true });
    }

    if (query.category) {
      qb.andWhere('project.category = :category', { category: query.category });
    }

    if (query.featured !== undefined) {
      qb.andWhere('project.isFeatured = :featured', { featured: query.featured });
    }

    if (query.search) {
      // Parameterised LIKE — never string-concatenated into the SQL.
      const term = `%${query.search.toLowerCase()}%`;
      qb.andWhere(
        new Brackets((w) => {
          w.where('LOWER(project.title) LIKE :term', { term })
            .orWhere('LOWER(project.description) LIKE :term', { term })
            .orWhere('LOWER(project.techStack) LIKE :term', { term });
        }),
      );
    }

    qb.orderBy('project.sortOrder', 'ASC')
      .addOrderBy('project.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [items, total] = await qb.getManyAndCount();
    return paginate(items, total, page, limit);
  }

  /** Category counts for the filter chips, so the UI can show "Cloud (3)". */
  async countsByCategory(): Promise<Record<string, number>> {
    const rows = await this.projectRepo
      .createQueryBuilder('project')
      .select('project.category', 'category')
      .addSelect('COUNT(*)', 'count')
      .where('project.isPublished = true')
      .groupBy('project.category')
      .getRawMany<{ category: string; count: string }>();

    const counts = rows.reduce<Record<string, number>>((acc, row) => {
      acc[row.category] = parseInt(row.count, 10);
      return acc;
    }, {});
    counts.All = Object.values(counts).reduce((sum, n) => sum + n, 0);
    return counts;
  }

  async findOne(id: string, opts: { publicOnly: boolean }): Promise<Project> {
    const project = await this.projectRepo.findOne({ where: { id } });
    if (!project || (opts.publicOnly && !project.isPublished)) {
      throw new NotFoundException(`Project ${id} not found.`);
    }
    return project;
  }

  async create(dto: CreateProjectDto): Promise<Project> {
    const project = this.projectRepo.create(dto);
    return this.projectRepo.save(project);
  }

  async update(id: string, dto: UpdateProjectDto): Promise<Project> {
    const project = await this.findOne(id, { publicOnly: false });
    // `preload` merges only the keys present on the DTO, so PATCH stays partial.
    const merged = await this.projectRepo.preload({ id: project.id, ...dto });
    return this.projectRepo.save(merged as Project);
  }

  async remove(id: string): Promise<{ id: string; deleted: true }> {
    const project = await this.findOne(id, { publicOnly: false });
    await this.projectRepo.remove(project);
    return { id, deleted: true };
  }

  /** Bulk drag-and-drop reordering from the dashboard. */
  async reorder(order: Array<{ id: string; sortOrder: number }>) {
    await this.projectRepo.manager.transaction(async (manager) => {
      for (const { id, sortOrder } of order) {
        await manager.update(Project, id, { sortOrder });
      }
    });
    return { updated: order.length };
  }
}

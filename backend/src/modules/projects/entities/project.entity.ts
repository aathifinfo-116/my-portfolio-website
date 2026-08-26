import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

/** Drives the portfolio filter chips: All | Microservices | Full-Stack | Cloud. */
export enum ProjectCategory {
  MICROSERVICES = 'Microservices',
  FULL_STACK = 'Full-Stack',
  CLOUD = 'Cloud',
  MOBILE = 'Mobile',
  OTHER = 'Other',
}

@Entity('projects')
export class Project extends BaseEntity {
  @Column({ type: 'varchar', length: 160 })
  title!: string;

  /** Small line under the title, e.g. "Allianz Insurance · Enterprise Integration". */
  @Column({ type: 'varchar', length: 200, nullable: true })
  subtitle!: string | null;

  @Index()
  @Column({ type: 'enum', enum: ProjectCategory, default: ProjectCategory.OTHER })
  category!: ProjectCategory;

  @Column({ type: 'text' })
  description!: string;

  // --- Case-study breakdown, rendered in the project detail view ---
  @Column({ type: 'text', nullable: true })
  problem!: string | null;

  @Column({ type: 'text', nullable: true })
  solution!: string | null;

  @Column({ type: 'text', nullable: true })
  impact!: string | null;

  /** Stored as a comma-joined text column; exposed to the API as string[]. */
  @Column({ type: 'simple-array', default: '' })
  techStack!: string[];

  @Column({ type: 'varchar', length: 500, nullable: true })
  githubUrl!: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  liveUrl!: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  imageUrl!: string | null;

  /** Shown in the "Featured Projects" strip on the home page. */
  @Index()
  @Column({ type: 'boolean', default: false })
  isFeatured!: boolean;

  /** Hidden from public endpoints while still editable in the dashboard. */
  @Index()
  @Column({ type: 'boolean', default: true })
  isPublished!: boolean;

  @Column({ type: 'int', default: 0 })
  sortOrder!: number;

  @Column({ type: 'varchar', length: 40, nullable: true })
  completedOn!: string | null;
}

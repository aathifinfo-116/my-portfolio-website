import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

/**
 * Named ServiceOffering rather than "Service" so it never reads ambiguously
 * next to Nest's own @Injectable services.
 */
@Entity('service_offerings')
export class ServiceOffering extends BaseEntity {
  @Column({ type: 'varchar', length: 160 })
  title!: string;

  @Column({ type: 'text' })
  description!: string;

  /** Lucide React icon name, e.g. "Boxes", "Layers", "Cloud", "Database". */
  @Column({ type: 'varchar', length: 60, default: 'Sparkles' })
  iconName!: string;

  /** Tailwind gradient classes for the icon badge, e.g. "from-purple-500 to-indigo-500". */
  @Column({ type: 'varchar', length: 120, nullable: true })
  accentGradient!: string | null;

  @Column({ type: 'simple-array', default: '' })
  techTags!: string[];

  @Index()
  @Column({ type: 'boolean', default: true })
  isPublished!: boolean;

  @Column({ type: 'int', default: 0 })
  sortOrder!: number;
}

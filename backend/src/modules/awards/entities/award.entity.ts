import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

@Entity('awards')
export class Award extends BaseEntity {
  @Column({ type: 'varchar', length: 200 })
  title!: string;

  /** Awarding organisation, e.g. "Allianz Insurance Lanka" or "SLIIT". */
  @Column({ type: 'varchar', length: 180 })
  issuer!: string;

  @Index()
  @Column({ type: 'int', nullable: true })
  year!: number | null;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({ type: 'varchar', length: 60, default: 'Trophy' })
  iconName!: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  imageUrl!: string | null;

  @Index()
  @Column({ type: 'boolean', default: true })
  isPublished!: boolean;

  @Column({ type: 'int', default: 0 })
  sortOrder!: number;
}

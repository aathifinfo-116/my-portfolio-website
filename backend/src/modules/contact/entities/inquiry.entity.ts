import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

export enum InquiryStatus {
  NEW = 'new',
  READ = 'read',
  REPLIED = 'replied',
  ARCHIVED = 'archived',
}

@Entity('inquiries')
export class Inquiry extends BaseEntity {
  @Column({ type: 'varchar', length: 120 })
  name!: string;

  @Index()
  @Column({ type: 'varchar', length: 180 })
  email!: string;

  @Column({ type: 'varchar', length: 200, nullable: true })
  subject!: string | null;

  @Column({ type: 'text' })
  message!: string;

  @Index()
  @Column({ type: 'boolean', default: false })
  isRead!: boolean;

  @Index()
  @Column({ type: 'enum', enum: InquiryStatus, default: InquiryStatus.NEW })
  status!: InquiryStatus;

  /** Captured for abuse triage only; never exposed on a public endpoint. */
  @Column({ type: 'varchar', length: 64, nullable: true, select: false })
  ipAddress!: string | null;

  @Column({ type: 'varchar', length: 300, nullable: true, select: false })
  userAgent!: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  readAt!: Date | null;
}

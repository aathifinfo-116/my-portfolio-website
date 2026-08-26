import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

/** Subject area, drives the primary filter row. */
export enum DocumentDomain {
  DEVELOPMENT = 'Development',
  CLOUD = 'Cloud',
  DEVOPS = 'DevOps',
  AI = 'AI',
  MANAGEMENT = 'Management',
  RESEARCH = 'Research',
  OTHER = 'Other',
}

/** Normalised format, drives the secondary filter row and the viewer mode. */
export enum DocumentFileType {
  PDF = 'pdf',
  DOCX = 'docx',
  PPTX = 'pptx',
}

/** Extension -> stored file type, for both uploads and validation. */
export const EXTENSION_FILE_TYPE: Record<string, DocumentFileType> = {
  '.pdf': DocumentFileType.PDF,
  '.doc': DocumentFileType.DOCX,
  '.docx': DocumentFileType.DOCX,
  '.ppt': DocumentFileType.PPTX,
  '.pptx': DocumentFileType.PPTX,
};

@Entity('documents')
export class Document extends BaseEntity {
  @Column({ type: 'varchar', length: 220 })
  title!: string;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Index()
  @Column({ type: 'enum', enum: DocumentDomain, default: DocumentDomain.OTHER })
  domain!: DocumentDomain;

  @Index()
  @Column({ type: 'enum', enum: DocumentFileType })
  fileType!: DocumentFileType;

  /** Public URL of the stored file (served from /static). */
  @Column({ type: 'varchar', length: 500 })
  fileUrl!: string;

  /** Original filename, used for the download prompt. */
  @Column({ type: 'varchar', length: 220 })
  fileName!: string;

  @Column({ type: 'int', default: 0 })
  fileSizeBytes!: number;

  @Column({ type: 'varchar', length: 120, nullable: true })
  mimeType!: string | null;

  /** Free-form label shown on the card, e.g. "Kubernetes", "System Design". */
  @Column({ type: 'varchar', length: 120, nullable: true })
  topic!: string | null;

  /** Distinct from createdAt so a backfilled record can show its real date. */
  @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  uploadedAt!: Date;

  @Index()
  @Column({ type: 'boolean', default: true })
  isPublished!: boolean;

  @Column({ type: 'int', default: 0 })
  sortOrder!: number;

  @Column({ type: 'int', default: 0 })
  downloadCount!: number;
}

import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

/**
 * Study materials moved to the Document entity, which carries the domain and
 * file-type attributes those records actually need.
 */
export enum CertificationCategory {
  ACADEMIC_DEGREE = 'Academic Degree',
  PROFESSIONAL = 'Professional',
  CERTIFICATION = 'Certification',
}

@Entity('certifications')
export class Certification extends BaseEntity {
  @Column({ type: 'varchar', length: 220 })
  title!: string;

  /** Issuing body — SLIIT, Oracle, AWS, Allianz… */
  @Column({ type: 'varchar', length: 180 })
  institution!: string;

  @Index()
  @Column({
    type: 'enum',
    enum: CertificationCategory,
    default: CertificationCategory.CERTIFICATION,
  })
  category!: CertificationCategory;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  /** Free-form so "2022", "Mar 2024", "2019 – 2023" all render correctly. */
  @Column({ type: 'varchar', length: 60, nullable: true })
  issuedOn!: string | null;

  /** Sortable key behind the display string; drives the timeline ordering. */
  @Index()
  @Column({ type: 'int', nullable: true })
  issuedYear!: number | null;

  /** Uploaded PDF (transcript, certificate, award letter). */
  @Column({ type: 'varchar', length: 500, nullable: true })
  documentUrl!: string | null;

  @Column({ type: 'varchar', length: 200, nullable: true })
  documentName!: string | null;

  @Column({ type: 'int', nullable: true })
  documentSizeBytes!: number | null;

  /** Logo or badge image shown on the card. */
  @Column({ type: 'varchar', length: 500, nullable: true })
  badgeUrl!: string | null;

  /** External verification page (Credly, university portal, …). */
  @Column({ type: 'varchar', length: 500, nullable: true })
  credentialUrl!: string | null;

  /** Marks the "Verified" pill on the card. */
  @Column({ type: 'boolean', default: false })
  isVerified!: boolean;

  @Index()
  @Column({ type: 'boolean', default: true })
  isPublished!: boolean;

  @Column({ type: 'int', default: 0 })
  sortOrder!: number;
}

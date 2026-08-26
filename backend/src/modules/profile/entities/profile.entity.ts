import { Column, Entity } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

export interface SocialLink {
  platform: string;
  url: string;
  icon: string;
}

/**
 * Singleton row backing the sidebar and hero. ProfileService always reads and
 * writes the single row, creating it on first access.
 */
@Entity('profile')
export class Profile extends BaseEntity {
  @Column({ type: 'varchar', length: 120, default: 'Aathif Thahir' })
  name!: string;

  @Column({ type: 'varchar', length: 160, default: 'Software Engineer' })
  title!: string;

  @Column({ type: 'varchar', length: 300, nullable: true })
  headline!: string | null;

  @Column({ type: 'text', nullable: true })
  bio!: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  avatarUrl!: string | null;

  // --- Metric cards ---
  @Column({ type: 'varchar', length: 20, default: '2.5+' })
  yearsExperience!: string;

  @Column({ type: 'int', default: 0 })
  projectsCompleted!: number;

  @Column({ type: 'int', default: 0 })
  happyClients!: number;

  @Column({ type: 'int', default: 0 })
  awardsWon!: number;

  // --- Contact block ---
  @Column({ type: 'varchar', length: 180, default: 'aathifinfo116@gmail.com' })
  email!: string;

  @Column({ type: 'varchar', length: 40, nullable: true })
  phone!: string | null;

  @Column({ type: 'varchar', length: 160, nullable: true })
  location!: string | null;

  /** jsonb so links can be reordered/extended without a migration. */
  @Column({ type: 'jsonb', default: () => "'[]'::jsonb" })
  socialLinks!: SocialLink[];

  // --- Resume ---
  @Column({ type: 'varchar', length: 500, nullable: true })
  resumeUrl!: string | null;

  @Column({
    type: 'varchar',
    length: 200,
    default: 'Aathif_Thahir_Resume.pdf',
  })
  resumeFileName!: string;

  /** Toggles the "Available for Freelance Projects" sidebar card. */
  @Column({ type: 'boolean', default: true })
  isAvailableForHire!: boolean;

  @Column({ type: 'varchar', length: 200, nullable: true })
  availabilityNote!: string | null;
}

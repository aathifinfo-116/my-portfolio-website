import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

@Entity('admin_users')
export class AdminUser extends BaseEntity {
  @Index({ unique: true })
  @Column({ type: 'varchar', length: 180 })
  email!: string;

  /** bcrypt hash — never selected by default so it cannot leak into a response. */
  @Column({ type: 'varchar', length: 120, select: false })
  passwordHash!: string;

  @Column({ type: 'varchar', length: 120, default: 'Administrator' })
  displayName!: string;

  @Column({ type: 'boolean', default: true })
  isActive!: boolean;

  @Column({ type: 'timestamptz', nullable: true })
  lastLoginAt!: Date | null;
}

import {
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcryptjs';
import { Repository } from 'typeorm';
import { AdminUser } from './entities/admin-user.entity';
import { ChangePasswordDto, LoginDto } from './dto/login.dto';

const BCRYPT_ROUNDS = 12;

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectRepository(AdminUser)
    private readonly adminRepo: Repository<AdminUser>,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  async login(dto: LoginDto) {
    // passwordHash has `select: false`, so ask for it explicitly.
    const user = await this.adminRepo.findOne({
      where: { email: dto.email.toLowerCase().trim() },
      select: ['id', 'email', 'passwordHash', 'displayName', 'isActive'],
    });

    // Same error for "no such user" and "wrong password" so the endpoint
    // cannot be used to enumerate valid admin emails.
    const invalid = new UnauthorizedException('Invalid email or password.');
    if (!user || !user.isActive) {
      // Burn a comparable amount of time so timing does not leak existence.
      await bcrypt.compare(dto.password, '$2a$12$invalidinvalidinvalidinvalidinvalidinvalidinvalidinvalidiu');
      throw invalid;
    }

    const matches = await bcrypt.compare(dto.password, user.passwordHash);
    if (!matches) {
      throw invalid;
    }

    await this.adminRepo.update(user.id, { lastLoginAt: new Date() });

    return {
      accessToken: await this.jwtService.signAsync({
        sub: user.id,
        email: user.email,
      }),
      expiresIn: this.config.get<string>('jwt.expiresIn'),
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
      },
    };
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.adminRepo.findOne({
      where: { id: userId },
      select: ['id', 'passwordHash'],
    });
    if (!user) {
      throw new UnauthorizedException('Account not found.');
    }

    const matches = await bcrypt.compare(dto.currentPassword, user.passwordHash);
    if (!matches) {
      throw new UnauthorizedException('Current password is incorrect.');
    }

    await this.adminRepo.update(user.id, {
      passwordHash: await AuthService.hash(dto.newPassword),
    });

    return { message: 'Password updated.' };
  }

  findActiveById(id: string) {
    return this.adminRepo.findOne({ where: { id, isActive: true } });
  }

  static hash(plain: string) {
    return bcrypt.hash(plain, BCRYPT_ROUNDS);
  }

  /**
   * Creates the admin account from env vars if none exists yet.
   * Called by the seed command; safe to run repeatedly.
   */
  async ensureAdminSeeded() {
    const email = this.config.getOrThrow<string>('admin.email').toLowerCase();
    const existing = await this.adminRepo.findOne({ where: { email } });
    if (existing) {
      this.logger.log(`Admin account already present: ${email}`);
      return existing;
    }

    const created = this.adminRepo.create({
      email,
      displayName: 'Aathif Thahir',
      passwordHash: await AuthService.hash(
        this.config.getOrThrow<string>('admin.password'),
      ),
    });
    const saved = await this.adminRepo.save(created);
    this.logger.log(`Seeded admin account: ${email}`);
    return saved;
  }
}

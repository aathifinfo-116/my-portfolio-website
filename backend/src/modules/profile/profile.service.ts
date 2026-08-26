import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { constants as fsConstants, promises as fs } from 'fs';
import * as path from 'path';
import { Repository } from 'typeorm';
import { StorageService } from '../uploads/storage.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { Profile } from './entities/profile.entity';

@Injectable()
export class ProfileService {
  constructor(
    @InjectRepository(Profile)
    private readonly profileRepo: Repository<Profile>,
    private readonly storage: StorageService,
  ) {}

  /**
   * Reads the singleton row, creating it with entity defaults on first call so
   * a fresh database still serves a usable hero section.
   */
  async get(): Promise<Profile> {
    const existing = await this.profileRepo.find({
      order: { createdAt: 'ASC' },
      take: 1,
    });
    if (existing.length > 0) {
      return existing[0];
    }
    return this.profileRepo.save(this.profileRepo.create({}));
  }

  async update(dto: UpdateProfileDto): Promise<Profile> {
    const profile = await this.get();
    Object.assign(profile, dto);
    return this.profileRepo.save(profile);
  }

  /**
   * Resolves the stored CV for the download endpoint, with the same
   * existence check the document downloads use: streaming a missing path
   * emits an unhandled 'error' that would take the process down.
   */
  async resolveResumeForDownload() {
    const profile = await this.get();

    if (!profile.resumeUrl) {
      throw new NotFoundException('No resume has been uploaded yet.');
    }

    const absolutePath = this.storage.resolveStoredPath(profile.resumeUrl);
    if (!absolutePath) {
      throw new NotFoundException('The stored resume is no longer available.');
    }

    try {
      await fs.access(absolutePath, fsConstants.R_OK);
      const stats = await fs.stat(absolutePath);
      return {
        absolutePath,
        size: stats.size,
        fileName: profile.resumeFileName || path.basename(absolutePath),
      };
    } catch {
      throw new NotFoundException('The resume file could not be found on disk.');
    }
  }

  async setResume(file: { url: string; originalName: string }) {
    const profile = await this.get();
    if (profile.resumeUrl) {
      await this.storage.removeByUrl(profile.resumeUrl);
    }
    profile.resumeUrl = file.url;
    profile.resumeFileName = file.originalName;
    return this.profileRepo.save(profile);
  }

  async setAvatar(file: { url: string }) {
    const profile = await this.get();
    if (profile.avatarUrl) {
      await this.storage.removeByUrl(profile.avatarUrl);
    }
    profile.avatarUrl = file.url;
    return this.profileRepo.save(profile);
  }
}

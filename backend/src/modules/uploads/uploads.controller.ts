import {
  BadRequestException,
  Controller,
  Delete,
  Param,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { DocumentDomain } from '../documents/entities/document.entity';
import { StorageService } from './storage.service';

/** Display domain -> folder name under uploads/documents. */
export const DOMAIN_FOLDER: Record<DocumentDomain, string> = {
  [DocumentDomain.DEVELOPMENT]: 'development',
  [DocumentDomain.CLOUD]: 'cloud',
  [DocumentDomain.DEVOPS]: 'devops',
  [DocumentDomain.AI]: 'ai',
  [DocumentDomain.MANAGEMENT]: 'management',
  [DocumentDomain.RESEARCH]: 'research',
  [DocumentDomain.OTHER]: 'other',
};

/** Accepts either the display name ("DevOps") or the folder name ("devops"). */
export function resolveDomainFolder(value: string): string {
  const direct = DOMAIN_FOLDER[value as DocumentDomain];
  if (direct) return direct;

  const lowered = value.toLowerCase();
  const match = Object.values(DOMAIN_FOLDER).find(
    (folder) => folder === lowered,
  );
  if (match) return match;

  throw new BadRequestException(
    `Unknown domain "${value}". Expected one of: ${Object.keys(DOMAIN_FOLDER).join(', ')}.`,
  );
}

/**
 * Upload endpoints for the admin portal: upload first, get a URL back, then
 * submit that URL as part of the entity payload.
 *
 * Every route here requires a JWT — the global JwtAuthGuard covers anything
 * not explicitly marked @Public().
 */
@Controller('uploads')
export class UploadsController {
  constructor(private readonly storage: StorageService) {}

  @Post('avatar')
  @UseInterceptors(FileInterceptor('file'))
  uploadAvatar(@UploadedFile() file: Express.Multer.File) {
    return this.storage.saveAvatar(file);
  }

  @Post('resume')
  @UseInterceptors(FileInterceptor('file'))
  uploadResume(@UploadedFile() file: Express.Multer.File) {
    return this.storage.saveResume(file);
  }

  @Post('project-image')
  @UseInterceptors(FileInterceptor('file'))
  uploadProjectImage(@UploadedFile() file: Express.Multer.File) {
    return this.storage.saveProjectImage(file);
  }

  @Post('badge')
  @UseInterceptors(FileInterceptor('file'))
  uploadBadge(@UploadedFile() file: Express.Multer.File) {
    return this.storage.saveBadge(file);
  }

  @Post('award-image')
  @UseInterceptors(FileInterceptor('file'))
  uploadAwardImage(@UploadedFile() file: Express.Multer.File) {
    return this.storage.saveAwardImage(file);
  }

  /**
   * Routes the file into uploads/documents/{domain} based on the path param,
   * so study materials land in the folder the public site filters on.
   */
  @Post('document/:domain')
  @UseInterceptors(FileInterceptor('file'))
  uploadDocument(
    @Param('domain') domain: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.storage.saveStudyMaterialForDomain(
      file,
      resolveDomainFolder(domain),
    );
  }

  /** Generic PDF/image fallbacks, kept for the certification document field. */
  @Post('document')
  @UseInterceptors(FileInterceptor('file'))
  uploadGenericDocument(@UploadedFile() file: Express.Multer.File) {
    return this.storage.saveDocument(file);
  }

  @Post('image')
  @UseInterceptors(FileInterceptor('file'))
  uploadImage(@UploadedFile() file: Express.Multer.File) {
    return this.storage.saveImage(file);
  }

  @Delete()
  async remove(@Query('url') url: string) {
    await this.storage.removeByUrl(url);
    return { url, deleted: true };
  }
}

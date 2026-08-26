import {
  Body,
  Controller,
  Get,
  Patch,
  Post,
  Req,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Request, Response } from 'express';
import { streamFileDownload } from '../../common/http/file-download';
import { Public } from '../../common/decorators/public.decorator';
import { StorageService } from '../uploads/storage.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ProfileService } from './profile.service';

@Controller('profile')
export class ProfileController {
  constructor(
    private readonly profileService: ProfileService,
    private readonly storage: StorageService,
  ) {}

  @Public()
  @Get()
  get() {
    return this.profileService.get();
  }

  /**
   * Streams the CV as an attachment. Public, like the profile itself, and
   * preferred over linking straight at /static: the explicit
   * Content-Disposition is what makes a browser save a PDF rather than hand
   * it to its built-in viewer.
   */
  @Public()
  @Get('resume/download')
  async downloadResume(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { absolutePath, size, fileName } =
      await this.profileService.resolveResumeForDownload();

    return streamFileDownload(req, res, {
      absolutePath,
      fileName,
      mimeType: 'application/pdf',
      size,
    });
  }

  @Patch()
  update(@Body() dto: UpdateProfileDto) {
    return this.profileService.update(dto);
  }

  @Post('resume')
  @UseInterceptors(FileInterceptor('file'))
  async uploadResume(@UploadedFile() file: Express.Multer.File) {
    const stored = await this.storage.saveDocument(file);
    return this.profileService.setResume(stored);
  }

  @Post('avatar')
  @UseInterceptors(FileInterceptor('file'))
  async uploadAvatar(@UploadedFile() file: Express.Multer.File) {
    const stored = await this.storage.saveImage(file);
    return this.profileService.setAvatar(stored);
  }
}

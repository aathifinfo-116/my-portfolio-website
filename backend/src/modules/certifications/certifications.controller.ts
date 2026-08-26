import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Public } from '../../common/decorators/public.decorator';
import { StorageService } from '../uploads/storage.service';
import { CertificationsService } from './certifications.service';
import { CreateCertificationDto } from './dto/create-certification.dto';
import { QueryCertificationsDto } from './dto/query-certifications.dto';
import { UpdateCertificationDto } from './dto/update-certification.dto';

@Controller('certifications')
export class CertificationsController {
  constructor(
    private readonly certificationsService: CertificationsService,
    private readonly storage: StorageService,
  ) {}

  // ---------- Public ----------

  @Public()
  @Get()
  findAll(@Query() query: QueryCertificationsDto) {
    return this.certificationsService.findAll(query, { publicOnly: true });
  }

  /** Category-bucketed payload for the Studies & Certs section. */
  @Public()
  @Get('grouped')
  findGrouped() {
    return this.certificationsService.findGrouped();
  }

  @Public()
  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.certificationsService.findOne(id, { publicOnly: true });
  }

  // ---------- Admin ----------

  @Get('admin/all')
  findAllAdmin(@Query() query: QueryCertificationsDto) {
    return this.certificationsService.findAll(
      { ...query, includeUnpublished: true },
      { publicOnly: false },
    );
  }

  @Post()
  create(@Body() dto: CreateCertificationDto) {
    return this.certificationsService.create(dto);
  }

  /**
   * Upload or replace the PDF for one record in a single multipart request.
   * StorageService validates the MIME type and size before it is persisted.
   */
  @Post(':id/document')
  @UseInterceptors(FileInterceptor('file'))
  async uploadDocument(
    @Param('id', ParseUUIDPipe) id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    const stored = await this.storage.saveDocument(file);
    return this.certificationsService.attachDocument(id, stored);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCertificationDto,
  ) {
    return this.certificationsService.update(id, dto);
  }

  @HttpCode(HttpStatus.OK)
  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.certificationsService.remove(id);
  }
}

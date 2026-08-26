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
  Req,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Request, Response } from 'express';
import { streamFileDownload } from '../../common/http/file-download';
import { Public } from '../../common/decorators/public.decorator';
import { DocumentSyncService } from './document-sync.service';
import { DocumentsService } from './documents.service';
import {
  CreateDocumentDto,
  QueryDocumentsDto,
  UpdateDocumentDto,
} from './dto/document.dto';

@Controller('documents')
export class DocumentsController {
  constructor(
    private readonly documentsService: DocumentsService,
    private readonly syncService: DocumentSyncService,
  ) {}

  // ---------- Public ----------

  /** Supports /documents?domain=DevOps&fileType=pdf */
  @Public()
  @Get()
  findAll(@Query() query: QueryDocumentsDto) {
    return this.documentsService.findAll(query, { publicOnly: true });
  }

  /** Counts per domain and per format, for the filter chips. */
  @Public()
  @Get('facets')
  facets() {
    return this.documentsService.facets();
  }

  /** Enum values, so the UI never hardcodes the filter lists. */
  @Public()
  @Get('options')
  options() {
    return {
      domains: DocumentsService.DOMAINS,
      fileTypes: DocumentsService.FILE_TYPES,
    };
  }

  @Public()
  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.documentsService.findOne(id, { publicOnly: true });
  }

  /**
   * Streams the file with Content-Disposition: attachment so the browser saves
   * it under its original name rather than the generated storage name.
   */
  @Public()
  @Get(':id/download')
  async download(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { document, absolutePath, actualSize } =
      await this.documentsService.resolveForDownload(id);

    return streamFileDownload(req, res, {
      absolutePath,
      fileName: document.fileName,
      mimeType: document.mimeType,
      size: actualSize,
    });
  }

  // ---------- Admin ----------

  /**
   * Reconciles the documents table with the files actually on disk.
   * Safe to re-run; never deletes rows or files.
   */
  @HttpCode(HttpStatus.OK)
  @Post('sync')
  sync(@Query('prune') prune?: string) {
    // Pruning deletes rows whose file is gone; without it they are unpublished.
    return this.syncService.sync({ prune: prune === 'true' });
  }

  @Get('admin/all')
  findAllAdmin(@Query() query: QueryDocumentsDto) {
    return this.documentsService.findAll(
      { ...query, includeUnpublished: true },
      { publicOnly: false },
    );
  }

  /** Create the record and upload its file in one multipart request. */
  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  createWithFile(
    @Body() dto: CreateDocumentDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.documentsService.createWithFile(dto, file);
  }

  @Post()
  create(@Body() dto: CreateDocumentDto) {
    return this.documentsService.create(dto);
  }

  @Post(':id/file')
  @UseInterceptors(FileInterceptor('file'))
  replaceFile(
    @Param('id', ParseUUIDPipe) id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.documentsService.replaceFile(id, file);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateDocumentDto,
  ) {
    return this.documentsService.update(id, dto);
  }

  @HttpCode(HttpStatus.OK)
  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.documentsService.remove(id);
  }
}

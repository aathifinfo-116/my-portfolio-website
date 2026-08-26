import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UploadsModule } from '../uploads/uploads.module';
import { DocumentSyncService } from './document-sync.service';
import { DocumentsController } from './documents.controller';
import { DocumentsService } from './documents.service';
import { Document } from './entities/document.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Document]), UploadsModule],
  controllers: [DocumentsController],
  providers: [DocumentsService, DocumentSyncService],
  exports: [DocumentsService, DocumentSyncService],
})
export class DocumentsModule {}

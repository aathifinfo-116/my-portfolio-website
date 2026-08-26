import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MulterModule } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { StorageService } from './storage.service';
import { UploadsController } from './uploads.controller';

@Module({
  imports: [
    MulterModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      // Buffer in memory so StorageService can validate before anything
      // touches disk; files here are small (PDFs and preview images).
      useFactory: (config: ConfigService) => ({
        storage: memoryStorage(),
        limits: {
          fileSize: config.get<number>('storage.maxUploadBytes', 10 * 1024 * 1024),
          files: 1,
        },
      }),
    }),
  ],
  controllers: [UploadsController],
  providers: [StorageService],
  exports: [StorageService],
})
export class UploadsModule {}

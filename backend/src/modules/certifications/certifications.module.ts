import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UploadsModule } from '../uploads/uploads.module';
import { CertificationsController } from './certifications.controller';
import { CertificationsService } from './certifications.service';
import { Certification } from './entities/certification.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Certification]), UploadsModule],
  controllers: [CertificationsController],
  providers: [CertificationsService],
  exports: [CertificationsService],
})
export class CertificationsModule {}

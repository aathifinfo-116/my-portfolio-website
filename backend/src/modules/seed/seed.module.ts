import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { Award } from '../awards/entities/award.entity';
import { Certification } from '../certifications/entities/certification.entity';
import { DocumentsModule } from '../documents/documents.module';
import { Document } from '../documents/entities/document.entity';
import { Profile } from '../profile/entities/profile.entity';
import { Project } from '../projects/entities/project.entity';
import { ServiceOffering } from '../services/entities/service-offering.entity';
import { SeedService } from './seed.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Profile,
      ServiceOffering,
      Project,
      Certification,
      Document,
      Award,
    ]),
    AuthModule,
    DocumentsModule,
  ],
  providers: [SeedService],
  exports: [SeedService],
})
export class SeedModule {}

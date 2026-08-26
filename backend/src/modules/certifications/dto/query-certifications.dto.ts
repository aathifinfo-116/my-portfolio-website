import { Transform } from 'class-transformer';
import { IsBoolean, IsEnum, IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { CertificationCategory } from '../entities/certification.entity';

export class QueryCertificationsDto extends PaginationQueryDto {
  @IsOptional()
  @IsEnum(CertificationCategory)
  category?: CertificationCategory;

  @IsOptional()
  @IsString()
  search?: string;

  /** Only rows that actually have a downloadable PDF attached. */
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  withDocument?: boolean;

  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  includeUnpublished?: boolean;
}

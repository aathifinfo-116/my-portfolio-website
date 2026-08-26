import { PartialType } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { DocumentDomain, DocumentFileType } from '../entities/document.entity';

export class CreateDocumentDto {
  @IsString()
  @MinLength(2)
  @MaxLength(220)
  title!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsEnum(DocumentDomain, {
    message: `domain must be one of: ${Object.values(DocumentDomain).join(', ')}`,
  })
  domain!: DocumentDomain;

  @IsOptional()
  @IsEnum(DocumentFileType)
  fileType?: DocumentFileType;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  fileUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(220)
  fileName?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  fileSizeBytes?: number;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  topic?: string;

  @IsOptional()
  @IsDateString()
  uploadedAt?: string;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isPublished?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  sortOrder?: number;
}

export class UpdateDocumentDto extends PartialType(CreateDocumentDto) {}

export class QueryDocumentsDto extends PaginationQueryDto {
  /** Omit (or send "All") to disable domain filtering. */
  @IsOptional()
  @IsEnum(DocumentDomain)
  domain?: DocumentDomain;

  /** Omit (or send "All Formats") to disable format filtering. */
  @IsOptional()
  @IsEnum(DocumentFileType)
  fileType?: DocumentFileType;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  includeUnpublished?: boolean;
}

import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { CertificationCategory } from '../entities/certification.entity';

export class CreateCertificationDto {
  @IsString()
  @MinLength(2)
  @MaxLength(220)
  title!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(180)
  institution!: string;

  @IsEnum(CertificationCategory, {
    message: `category must be one of: ${Object.values(CertificationCategory).join(', ')}`,
  })
  category!: CertificationCategory;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  issuedOn?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1950)
  @Max(2100)
  issuedYear?: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  documentUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  documentName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  badgeUrl?: string;

  @IsOptional()
  @IsUrl({ require_tld: false })
  credentialUrl?: string;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isVerified?: boolean;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isPublished?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  sortOrder?: number;
}

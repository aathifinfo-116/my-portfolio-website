import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ProjectCategory } from '../entities/project.entity';

/** Accepts either ["Java","React"] or "Java, React" from multipart form posts. */
const toStringArray = ({ value }: { value: unknown }): string[] => {
  if (Array.isArray(value)) return value.map((v) => String(v).trim()).filter(Boolean);
  if (typeof value === 'string') {
    return value.split(',').map((v) => v.trim()).filter(Boolean);
  }
  return [];
};

export class CreateProjectDto {
  @IsString()
  @MinLength(2)
  @MaxLength(160)
  title!: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  subtitle?: string;

  @IsEnum(ProjectCategory, {
    message: `category must be one of: ${Object.values(ProjectCategory).join(', ')}`,
  })
  category!: ProjectCategory;

  @IsString()
  @MinLength(10)
  description!: string;

  @IsOptional()
  @IsString()
  problem?: string;

  @IsOptional()
  @IsString()
  solution?: string;

  @IsOptional()
  @IsString()
  impact?: string;

  @IsArray()
  @IsString({ each: true })
  @Transform(toStringArray)
  techStack: string[] = [];

  @IsOptional()
  @IsUrl({ require_tld: false }, { message: 'githubUrl must be a valid URL.' })
  githubUrl?: string;

  @IsOptional()
  @IsUrl({ require_tld: false }, { message: 'liveUrl must be a valid URL.' })
  liveUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  imageUrl?: string;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isFeatured?: boolean;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isPublished?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  sortOrder?: number;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  completedOn?: string;
}

import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsEnum, IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { ProjectCategory } from '../entities/project.entity';

export class QueryProjectsDto extends PaginationQueryDto {
  /** Omit or pass "All" to disable category filtering. */
  @IsOptional()
  @IsEnum(ProjectCategory)
  category?: ProjectCategory;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  featured?: boolean;

  /** Admin-only: include unpublished drafts. Ignored on public routes. */
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  includeUnpublished?: boolean;
}

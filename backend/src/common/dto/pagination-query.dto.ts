import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

/**
 * Page size used when a request omits `limit`.
 * Controllers reference this so the DTO default and the service fallback
 * cannot drift apart.
 */
export const DEFAULT_PAGE_SIZE = 50;

/**
 * Hard ceiling on rows per request.
 *
 * These endpoints are public, so an uncapped `limit` would let anyone pull an
 * entire table in one query. Callers needing everything page through instead —
 * `totalPages` in the response tells them how many requests that takes.
 */
export const MAX_PAGE_SIZE = 100;

export class PaginationQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(MAX_PAGE_SIZE, {
    message: `limit must not be greater than ${MAX_PAGE_SIZE}. Request additional pages instead.`,
  })
  limit?: number = DEFAULT_PAGE_SIZE;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export function paginate<T>(
  items: T[],
  total: number,
  page: number,
  limit: number,
): PaginatedResult<T> {
  return {
    items,
    total,
    page,
    limit,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  };
}

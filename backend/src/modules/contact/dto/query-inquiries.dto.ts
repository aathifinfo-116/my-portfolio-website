import { Transform } from 'class-transformer';
import { IsBoolean, IsEnum, IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { InquiryStatus } from '../entities/inquiry.entity';

export class QueryInquiriesDto extends PaginationQueryDto {
  @IsOptional()
  @IsEnum(InquiryStatus)
  status?: InquiryStatus;

  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  unreadOnly?: boolean;

  @IsOptional()
  @IsString()
  search?: string;
}

export class UpdateInquiryStatusDto {
  @IsEnum(InquiryStatus, {
    message: `status must be one of: ${Object.values(InquiryStatus).join(', ')}`,
  })
  status!: InquiryStatus;
}

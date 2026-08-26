import { PartialType } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

const toStringArray = ({ value }: { value: unknown }): string[] => {
  if (Array.isArray(value)) return value.map((v) => String(v).trim()).filter(Boolean);
  if (typeof value === 'string') {
    return value.split(',').map((v) => v.trim()).filter(Boolean);
  }
  return [];
};

export class CreateServiceOfferingDto {
  @IsString()
  @MinLength(2)
  @MaxLength(160)
  title!: string;

  @IsString()
  @MinLength(10)
  description!: string;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  iconName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  accentGradient?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(toStringArray)
  techTags?: string[];

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isPublished?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  sortOrder?: number;
}

export class UpdateServiceOfferingDto extends PartialType(
  CreateServiceOfferingDto,
) {}

import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEmail,
  IsInt,
  IsOptional,
  IsString,
  Min,
  MaxLength,
  ValidateNested,
} from 'class-validator';

export class SocialLinkDto {
  @IsString()
  @MaxLength(40)
  platform!: string;

  @IsString()
  @MaxLength(500)
  url!: string;

  /** Lucide React icon name, e.g. "Linkedin" / "Github". */
  @IsString()
  @MaxLength(40)
  icon!: string;
}

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  headline?: string;

  @IsOptional()
  @IsString()
  bio?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  avatarUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  yearsExperience?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  projectsCompleted?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  happyClients?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  awardsWon?: number;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  phone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  location?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SocialLinkDto)
  socialLinks?: SocialLinkDto[];

  @IsOptional()
  @IsString()
  @MaxLength(500)
  resumeUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  resumeFileName?: string;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isAvailableForHire?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  availabilityNote?: string;
}

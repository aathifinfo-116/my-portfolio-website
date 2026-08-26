import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

export class CreateInquiryDto {
  @Transform(trim)
  @IsString()
  @MinLength(2, { message: 'Please enter your name.' })
  @MaxLength(120)
  name!: string;

  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsEmail({}, { message: 'Please enter a valid email address.' })
  @MaxLength(180)
  email!: string;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(200)
  subject?: string;

  @Transform(trim)
  @IsString()
  @MinLength(10, { message: 'Message must be at least 10 characters.' })
  @MaxLength(5000, { message: 'Message must be under 5000 characters.' })
  message!: string;

  /**
   * Honeypot: a field hidden with CSS in the form. Real users leave it empty;
   * naive bots fill every input they find. Non-empty means silent rejection.
   */
  @IsOptional()
  @IsString()
  website?: string;
}

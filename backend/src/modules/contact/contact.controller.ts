import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { Request } from 'express';
import { Public } from '../../common/decorators/public.decorator';
import { ContactService } from './contact.service';
import { CreateInquiryDto } from './dto/create-inquiry.dto';
import {
  QueryInquiriesDto,
  UpdateInquiryStatusDto,
} from './dto/query-inquiries.dto';

@Controller('contact')
export class ContactController {
  constructor(private readonly contactService: ContactService) {}

  // ---------- Public ----------

  /** 3 submissions per minute per IP, on top of the global throttle. */
  @Public()
  @Throttle({ default: { limit: 3, ttl: 60_000 } })
  @HttpCode(HttpStatus.CREATED)
  @Post()
  submit(@Body() dto: CreateInquiryDto, @Req() req: Request) {
    return this.contactService.submit(dto, {
      ipAddress: req.ip,
      userAgent: req.get('user-agent') ?? undefined,
    });
  }

  // ---------- Admin ----------

  @Get()
  findAll(@Query() query: QueryInquiriesDto) {
    return this.contactService.findAll(query);
  }

  @Get('stats')
  stats() {
    return this.contactService.stats();
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.contactService.findOne(id);
  }

  @Patch(':id/read')
  markRead(@Param('id', ParseUUIDPipe) id: string) {
    return this.contactService.markRead(id);
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateInquiryStatusDto,
  ) {
    return this.contactService.updateStatus(id, dto.status);
  }

  @HttpCode(HttpStatus.OK)
  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.contactService.remove(id);
  }
}

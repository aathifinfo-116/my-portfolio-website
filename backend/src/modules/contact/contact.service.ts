import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Repository } from 'typeorm';
import {
  DEFAULT_PAGE_SIZE,
  PaginatedResult,
  paginate,
} from '../../common/dto/pagination-query.dto';
import { CreateInquiryDto } from './dto/create-inquiry.dto';
import { QueryInquiriesDto } from './dto/query-inquiries.dto';
import { Inquiry, InquiryStatus } from './entities/inquiry.entity';

export interface RequestMeta {
  ipAddress?: string;
  userAgent?: string;
}

@Injectable()
export class ContactService {
  private readonly logger = new Logger(ContactService.name);

  constructor(
    @InjectRepository(Inquiry)
    private readonly inquiryRepo: Repository<Inquiry>,
  ) {}

  /**
   * Public submission. Returns the same success shape whether the message was
   * stored or silently dropped as spam, so a bot learns nothing from the reply.
   */
  async submit(dto: CreateInquiryDto, meta: RequestMeta) {
    const acknowledgement = {
      success: true as const,
      message: "Thanks for reaching out. I'll get back to you shortly.",
    };

    if (dto.website && dto.website.trim().length > 0) {
      this.logger.warn(`Honeypot triggered from ${meta.ipAddress ?? 'unknown'}`);
      return acknowledgement;
    }

    const inquiry = this.inquiryRepo.create({
      name: dto.name,
      email: dto.email,
      subject: dto.subject ?? null,
      message: dto.message,
      ipAddress: meta.ipAddress ?? null,
      userAgent: meta.userAgent?.slice(0, 300) ?? null,
    });

    await this.inquiryRepo.save(inquiry);
    this.logger.log(`New inquiry from ${dto.email}`);

    // Hook point: dispatch an email/Telegram notification here later.
    return acknowledgement;
  }

  async findAll(query: QueryInquiriesDto): Promise<PaginatedResult<Inquiry>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? DEFAULT_PAGE_SIZE;

    const qb = this.inquiryRepo.createQueryBuilder('inquiry');

    if (query.status) {
      qb.andWhere('inquiry.status = :status', { status: query.status });
    }

    if (query.unreadOnly) {
      qb.andWhere('inquiry.isRead = false');
    }

    if (query.search) {
      const term = `%${query.search.toLowerCase()}%`;
      qb.andWhere(
        new Brackets((w) => {
          w.where('LOWER(inquiry.name) LIKE :term', { term })
            .orWhere('LOWER(inquiry.email) LIKE :term', { term })
            .orWhere('LOWER(inquiry.subject) LIKE :term', { term })
            .orWhere('LOWER(inquiry.message) LIKE :term', { term });
        }),
      );
    }

    qb.orderBy('inquiry.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [items, total] = await qb.getManyAndCount();
    return paginate(items, total, page, limit);
  }

  /** Drives the unread badge in the dashboard sidebar. */
  async stats() {
    const [total, unread, replied] = await Promise.all([
      this.inquiryRepo.count(),
      this.inquiryRepo.count({ where: { isRead: false } }),
      this.inquiryRepo.count({ where: { status: InquiryStatus.REPLIED } }),
    ]);
    return { total, unread, replied };
  }

  async findOne(id: string) {
    const inquiry = await this.inquiryRepo.findOne({ where: { id } });
    if (!inquiry) {
      throw new NotFoundException(`Inquiry ${id} not found.`);
    }
    return inquiry;
  }

  /** Opening a message in the dashboard marks it read. */
  async markRead(id: string) {
    const inquiry = await this.findOne(id);
    if (!inquiry.isRead) {
      inquiry.isRead = true;
      inquiry.readAt = new Date();
      if (inquiry.status === InquiryStatus.NEW) {
        inquiry.status = InquiryStatus.READ;
      }
      await this.inquiryRepo.save(inquiry);
    }
    return inquiry;
  }

  async updateStatus(id: string, status: InquiryStatus) {
    const inquiry = await this.findOne(id);
    inquiry.status = status;
    if (status !== InquiryStatus.NEW && !inquiry.isRead) {
      inquiry.isRead = true;
      inquiry.readAt = new Date();
    }
    return this.inquiryRepo.save(inquiry);
  }

  async remove(id: string) {
    const inquiry = await this.findOne(id);
    await this.inquiryRepo.remove(inquiry);
    return { id, deleted: true as const };
  }
}

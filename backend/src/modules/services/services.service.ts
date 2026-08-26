import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  CreateServiceOfferingDto,
  UpdateServiceOfferingDto,
} from './dto/service-offering.dto';
import { ServiceOffering } from './entities/service-offering.entity';

@Injectable()
export class ServicesService {
  constructor(
    @InjectRepository(ServiceOffering)
    private readonly serviceRepo: Repository<ServiceOffering>,
  ) {}

  findAll(opts: { publicOnly: boolean }) {
    return this.serviceRepo.find({
      where: opts.publicOnly ? { isPublished: true } : {},
      order: { sortOrder: 'ASC', createdAt: 'ASC' },
    });
  }

  async findOne(id: string) {
    const offering = await this.serviceRepo.findOne({ where: { id } });
    if (!offering) {
      throw new NotFoundException(`Service ${id} not found.`);
    }
    return offering;
  }

  create(dto: CreateServiceOfferingDto) {
    return this.serviceRepo.save(this.serviceRepo.create(dto));
  }

  async update(id: string, dto: UpdateServiceOfferingDto) {
    const existing = await this.findOne(id);
    const merged = await this.serviceRepo.preload({ id: existing.id, ...dto });
    return this.serviceRepo.save(merged as ServiceOffering);
  }

  async remove(id: string) {
    const existing = await this.findOne(id);
    await this.serviceRepo.remove(existing);
    return { id, deleted: true as const };
  }
}

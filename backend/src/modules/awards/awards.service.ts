import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateAwardDto, UpdateAwardDto } from './dto/award.dto';
import { Award } from './entities/award.entity';

@Injectable()
export class AwardsService {
  constructor(
    @InjectRepository(Award)
    private readonly awardRepo: Repository<Award>,
  ) {}

  findAll(opts: { publicOnly: boolean }) {
    return this.awardRepo.find({
      where: opts.publicOnly ? { isPublished: true } : {},
      // Most recent honour first, with manual sortOrder able to override.
      order: { sortOrder: 'ASC', year: 'DESC', createdAt: 'DESC' },
    });
  }

  async findOne(id: string) {
    const award = await this.awardRepo.findOne({ where: { id } });
    if (!award) {
      throw new NotFoundException(`Award ${id} not found.`);
    }
    return award;
  }

  create(dto: CreateAwardDto) {
    return this.awardRepo.save(this.awardRepo.create(dto));
  }

  async update(id: string, dto: UpdateAwardDto) {
    const existing = await this.findOne(id);
    const merged = await this.awardRepo.preload({ id: existing.id, ...dto });
    return this.awardRepo.save(merged as Award);
  }

  async remove(id: string) {
    const existing = await this.findOne(id);
    await this.awardRepo.remove(existing);
    return { id, deleted: true as const };
  }
}

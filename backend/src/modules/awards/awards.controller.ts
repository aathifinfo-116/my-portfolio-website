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
} from '@nestjs/common';
import { Public } from '../../common/decorators/public.decorator';
import { AwardsService } from './awards.service';
import { CreateAwardDto, UpdateAwardDto } from './dto/award.dto';

@Controller('awards')
export class AwardsController {
  constructor(private readonly awardsService: AwardsService) {}

  @Public()
  @Get()
  findAll() {
    return this.awardsService.findAll({ publicOnly: true });
  }

  @Get('admin/all')
  findAllAdmin() {
    return this.awardsService.findAll({ publicOnly: false });
  }

  @Public()
  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.awardsService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateAwardDto) {
    return this.awardsService.create(dto);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateAwardDto,
  ) {
    return this.awardsService.update(id, dto);
  }

  @HttpCode(HttpStatus.OK)
  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.awardsService.remove(id);
  }
}

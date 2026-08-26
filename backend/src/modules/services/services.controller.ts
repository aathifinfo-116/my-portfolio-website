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
import {
  CreateServiceOfferingDto,
  UpdateServiceOfferingDto,
} from './dto/service-offering.dto';
import { ServicesService } from './services.service';

@Controller('services')
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) {}

  @Public()
  @Get()
  findAll() {
    return this.servicesService.findAll({ publicOnly: true });
  }

  @Get('admin/all')
  findAllAdmin() {
    return this.servicesService.findAll({ publicOnly: false });
  }

  @Public()
  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.servicesService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateServiceOfferingDto) {
    return this.servicesService.create(dto);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateServiceOfferingDto,
  ) {
    return this.servicesService.update(id, dto);
  }

  @HttpCode(HttpStatus.OK)
  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.servicesService.remove(id);
  }
}

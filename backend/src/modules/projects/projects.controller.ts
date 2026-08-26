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
} from '@nestjs/common';
import { Public } from '../../common/decorators/public.decorator';
import { CreateProjectDto } from './dto/create-project.dto';
import { QueryProjectsDto } from './dto/query-projects.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { ProjectsService } from './projects.service';

@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  // ---------- Public (consumed by the portfolio front end) ----------

  @Public()
  @Get()
  findAll(@Query() query: QueryProjectsDto) {
    return this.projectsService.findAll(query, { publicOnly: true });
  }

  @Public()
  @Get('counts')
  counts() {
    return this.projectsService.countsByCategory();
  }

  @Public()
  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.projectsService.findOne(id, { publicOnly: true });
  }

  // ---------- Admin (JWT required via the global guard) ----------

  @Get('admin/all')
  findAllAdmin(@Query() query: QueryProjectsDto) {
    return this.projectsService.findAll(
      { ...query, includeUnpublished: true },
      { publicOnly: false },
    );
  }

  @Post()
  create(@Body() dto: CreateProjectDto) {
    return this.projectsService.create(dto);
  }

  @Patch('reorder')
  reorder(@Body() body: { order: Array<{ id: string; sortOrder: number }> }) {
    return this.projectsService.reorder(body.order ?? []);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateProjectDto,
  ) {
    return this.projectsService.update(id, dto);
  }

  @HttpCode(HttpStatus.OK)
  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.projectsService.remove(id);
  }
}

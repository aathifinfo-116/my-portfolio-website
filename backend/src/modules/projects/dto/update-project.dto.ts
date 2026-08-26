import { PartialType } from '@nestjs/swagger';
import { CreateProjectDto } from './create-project.dto';

/** Every field optional — used for PATCH. */
export class UpdateProjectDto extends PartialType(CreateProjectDto) {}

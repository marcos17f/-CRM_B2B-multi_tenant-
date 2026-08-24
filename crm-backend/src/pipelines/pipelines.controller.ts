import { Body, Controller, Get, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { RequirePermission } from '../common/decorators/require-permission.decorator';
import { PERMISSIONS } from '../common/permissions/catalog';
import { CreatePipelineDto } from './dto/create-pipeline.dto';
import { PipelinesService } from './pipelines.service';

@Controller('pipelines')
export class PipelinesController {
  constructor(private readonly pipelines: PipelinesService) {}

  @Get()
  @RequirePermission(PERMISSIONS.PIPELINES_READ)
  list() {
    return this.pipelines.list();
  }

  @Get(':id')
  @RequirePermission(PERMISSIONS.PIPELINES_READ)
  get(@Param('id', ParseUUIDPipe) id: string) {
    return this.pipelines.get(id);
  }

  @Post()
  @RequirePermission(PERMISSIONS.PIPELINES_WRITE)
  create(@Body() dto: CreatePipelineDto) {
    return this.pipelines.create(dto);
  }
}

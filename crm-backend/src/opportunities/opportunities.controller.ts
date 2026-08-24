import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import { RequirePermission } from '../common/decorators/require-permission.decorator';
import { PERMISSIONS } from '../common/permissions/catalog';
import { CreateOpportunityDto } from './dto/create-opportunity.dto';
import { MoveStageDto } from './dto/move-stage.dto';
import { ReopenOpportunityDto } from './dto/reopen-opportunity.dto';
import { UpdateOpportunityDto } from './dto/update-opportunity.dto';
import { OpportunitiesService } from './opportunities.service';

@Controller('opportunities')
export class OpportunitiesController {
  constructor(private readonly opportunities: OpportunitiesService) {}

  @Get()
  @RequirePermission(PERMISSIONS.OPPORTUNITIES_READ)
  list(
    @Query('pipelineId') pipelineId?: string,
    @Query('stageId') stageId?: string,
    @Query('ownerId') ownerId?: string,
    @Query('status') status?: string,
  ) {
    return this.opportunities.list({ pipelineId, stageId, ownerId, status });
  }

  @Get(':id')
  @RequirePermission(PERMISSIONS.OPPORTUNITIES_READ)
  get(@Param('id', ParseUUIDPipe) id: string) {
    return this.opportunities.get(id);
  }

  @Post()
  @RequirePermission(PERMISSIONS.OPPORTUNITIES_WRITE)
  create(@Body() dto: CreateOpportunityDto) {
    return this.opportunities.create(dto);
  }

  @Patch(':id')
  @RequirePermission(PERMISSIONS.OPPORTUNITIES_WRITE)
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateOpportunityDto) {
    return this.opportunities.update(id, dto);
  }

  @Post(':id/move-stage')
  @RequirePermission(PERMISSIONS.OPPORTUNITIES_WRITE)
  moveStage(@Param('id', ParseUUIDPipe) id: string, @Body() dto: MoveStageDto) {
    return this.opportunities.moveStage(id, dto);
  }

  @Post(':id/reopen')
  @RequirePermission(PERMISSIONS.OPPORTUNITIES_WRITE)
  reopen(@Param('id', ParseUUIDPipe) id: string, @Body() dto: ReopenOpportunityDto) {
    return this.opportunities.reopen(id, dto);
  }
}

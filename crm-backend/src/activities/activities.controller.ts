import { BadRequestException, Body, Controller, Get, ParseIntPipe, Post, Query } from '@nestjs/common';
import { RequirePermission } from '../common/decorators/require-permission.decorator';
import { PERMISSIONS } from '../common/permissions/catalog';
import { ActivitiesService } from './activities.service';
import { CreateActivityDto } from './dto/create-activity.dto';

@Controller('activities')
export class ActivitiesController {
  constructor(private readonly activities: ActivitiesService) {}

  @Get('recent')
  @RequirePermission(PERMISSIONS.ACTIVITIES_READ)
  recent(@Query('limit', new ParseIntPipe({ optional: true })) limit = 20) {
    return this.activities.listRecent(limit);
  }

  @Get()
  @RequirePermission(PERMISSIONS.ACTIVITIES_READ)
  list(@Query('relatedToType') relatedToType?: string, @Query('relatedToId') relatedToId?: string) {
    if (!relatedToType || !relatedToId) {
      throw new BadRequestException('Informe relatedToType e relatedToId na query string.');
    }
    return this.activities.listForEntity(relatedToType, relatedToId);
  }

  @Post()
  @RequirePermission(PERMISSIONS.ACTIVITIES_WRITE)
  create(@Body() dto: CreateActivityDto) {
    return this.activities.createManual(dto);
  }
}

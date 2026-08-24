import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import { RequirePermission } from '../common/decorators/require-permission.decorator';
import { PERMISSIONS } from '../common/permissions/catalog';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { TasksService } from './tasks.service';

@Controller('tasks')
export class TasksController {
  constructor(private readonly tasks: TasksService) {}

  @Get()
  @RequirePermission(PERMISSIONS.TASKS_READ)
  list(
    @Query('relatedToType') relatedToType?: string,
    @Query('relatedToId') relatedToId?: string,
    @Query('assigneeId') assigneeId?: string,
    @Query('status') status?: string,
  ) {
    return this.tasks.list({ relatedToType, relatedToId, assigneeId, status });
  }

  @Get(':id')
  @RequirePermission(PERMISSIONS.TASKS_READ)
  get(@Param('id', ParseUUIDPipe) id: string) {
    return this.tasks.get(id);
  }

  @Post()
  @RequirePermission(PERMISSIONS.TASKS_WRITE)
  create(@Body() dto: CreateTaskDto) {
    return this.tasks.create(dto);
  }

  @Patch(':id')
  @RequirePermission(PERMISSIONS.TASKS_WRITE)
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateTaskDto) {
    return this.tasks.update(id, dto);
  }

  @Post(':id/complete')
  @RequirePermission(PERMISSIONS.TASKS_WRITE)
  complete(@Param('id', ParseUUIDPipe) id: string) {
    return this.tasks.complete(id);
  }
}

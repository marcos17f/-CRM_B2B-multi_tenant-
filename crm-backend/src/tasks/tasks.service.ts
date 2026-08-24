import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import type { Updateable } from 'kysely';
import type { TasksTable } from '../../db/types';
import { ActivitiesService } from '../activities/activities.service';
import { TenantDb } from '../database/tenant-db.service';
import type { CreateTaskDto } from './dto/create-task.dto';
import type { UpdateTaskDto } from './dto/update-task.dto';

export interface TaskFilters {
  relatedToType?: string;
  relatedToId?: string;
  assigneeId?: string;
  status?: string;
}

@Injectable()
export class TasksService {
  constructor(
    private readonly tenantDb: TenantDb,
    private readonly activities: ActivitiesService,
  ) {}

  list(filters: TaskFilters) {
    let query = this.tenantDb.db.selectFrom('tasks').selectAll().where('workspaceId', '=', this.tenantDb.workspaceId);
    if (filters.relatedToType) query = query.where('relatedToType', '=', filters.relatedToType);
    if (filters.relatedToId) query = query.where('relatedToId', '=', filters.relatedToId);
    if (filters.assigneeId) query = query.where('assigneeId', '=', filters.assigneeId);
    if (filters.status) query = query.where('status', '=', filters.status);
    return query.orderBy('dueDate', 'asc').execute();
  }

  async get(id: string) {
    const task = await this.tenantDb.db
      .selectFrom('tasks')
      .selectAll()
      .where('id', '=', id)
      .where('workspaceId', '=', this.tenantDb.workspaceId)
      .executeTakeFirst();
    if (!task) throw new NotFoundException('Tarefa não encontrada.');
    return task;
  }

  async create(dto: CreateTaskDto) {
    const task = await this.tenantDb.db
      .insertInto('tasks')
      .values({
        workspaceId: this.tenantDb.workspaceId,
        subject: dto.subject,
        description: dto.description ?? null,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
        assigneeId: dto.assigneeId ?? this.tenantDb.workspaceMemberId,
        relatedToType: dto.relatedToType,
        relatedToId: dto.relatedToId,
        createdBy: this.tenantDb.workspaceMemberId,
      })
      .returningAll()
      .executeTakeFirstOrThrow();

    await this.activities.log({
      type: 'task_created',
      relatedToType: dto.relatedToType,
      relatedToId: dto.relatedToId,
      payload: { taskId: task.id, subject: task.subject },
    });

    return task;
  }

  async update(id: string, dto: UpdateTaskDto) {
    await this.get(id);

    const values: Updateable<TasksTable> = {};
    if (dto.subject !== undefined) values.subject = dto.subject;
    if (dto.description !== undefined) values.description = dto.description;
    if (dto.dueDate !== undefined) values.dueDate = new Date(dto.dueDate);
    if (dto.assigneeId !== undefined) values.assigneeId = dto.assigneeId;

    return this.tenantDb.db
      .updateTable('tasks')
      .set(values)
      .where('id', '=', id)
      .where('workspaceId', '=', this.tenantDb.workspaceId)
      .returningAll()
      .executeTakeFirstOrThrow();
  }

  async complete(id: string) {
    const task = await this.get(id);
    if (task.status === 'completed') throw new ConflictException('Tarefa já concluída.');

    const updated = await this.tenantDb.db
      .updateTable('tasks')
      .set({ status: 'completed', completedAt: new Date() })
      .where('id', '=', id)
      .where('workspaceId', '=', this.tenantDb.workspaceId)
      .returningAll()
      .executeTakeFirstOrThrow();

    await this.activities.log({
      type: 'task_completed',
      relatedToType: task.relatedToType,
      relatedToId: task.relatedToId,
      payload: { taskId: task.id, subject: task.subject },
    });

    return updated;
  }
}

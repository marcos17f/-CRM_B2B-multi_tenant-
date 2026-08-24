import { IsIn, IsObject, IsOptional, IsUUID } from 'class-validator';

// Tipos "manuais": os únicos que a API deixa criar diretamente. stage_change, field_change,
// task_created, task_completed e ai_suggestion são sempre gerados pelo sistema (ver
// ActivitiesService.log, chamado internamente por OpportunitiesService/TasksService).
export const MANUAL_ACTIVITY_TYPES = ['call', 'email', 'meeting', 'note'] as const;

export class CreateActivityDto {
  @IsIn(MANUAL_ACTIVITY_TYPES)
  type!: (typeof MANUAL_ACTIVITY_TYPES)[number];

  @IsIn(['company', 'contact', 'opportunity'])
  relatedToType!: string;

  @IsUUID()
  relatedToId!: string;

  @IsOptional()
  @IsObject()
  payload?: Record<string, unknown>;
}

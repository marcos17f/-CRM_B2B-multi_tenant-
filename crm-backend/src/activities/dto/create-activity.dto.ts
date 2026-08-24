import { IsIn, IsObject, IsOptional, IsUUID } from 'class-validator';

// Tipos "manuais": os únicos que a API deixa criar diretamente. stage_change, field_change,
// task_created, task_completed e ai_suggestion são sempre gerados pelo sistema (ver
// ActivitiesService.log, chamado internamente por OpportunitiesService/TasksService).
// 'whatsapp' também é gerado automaticamente pelo módulo de integração (ver
// src/whatsapp/whatsapp-messaging.service.ts e whatsapp-webhook.service.ts), mas fica
// aqui também pra permitir registrar manualmente uma conversa que aconteceu fora do CRM.
export const MANUAL_ACTIVITY_TYPES = ['call', 'email', 'meeting', 'note', 'whatsapp'] as const;

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

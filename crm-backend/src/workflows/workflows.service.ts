import { Injectable, NotFoundException } from '@nestjs/common';
import { ActivitiesService } from '../activities/activities.service';
import { TenantDb } from '../database/tenant-db.service';
import type { OpportunitiesTable } from '../../db/types';
import type { Selectable } from 'kysely';
import { WORKFLOW_DEFINITIONS, WORKFLOW_KEYS } from './workflows.definitions';

type Opportunity = Selectable<OpportunitiesTable>;

@Injectable()
export class WorkflowsService {
  constructor(
    private readonly tenantDb: TenantDb,
    private readonly activities: ActivitiesService,
  ) {}

  /** Lista as automações fixas com o estado (ligado/desligado) deste workspace. */
  async list() {
    const settings = await this.tenantDb.db
      .selectFrom('workflowSettings')
      .select(['workflowKey', 'enabled'])
      .where('workspaceId', '=', this.tenantDb.workspaceId)
      .execute();
    const enabledByKey = new Map(settings.map((s) => [s.workflowKey, s.enabled]));

    return WORKFLOW_DEFINITIONS.map((def) => ({
      ...def,
      enabled: enabledByKey.get(def.key) ?? true,
    }));
  }

  async setEnabled(key: string, enabled: boolean) {
    if (!WORKFLOW_KEYS.includes(key)) throw new NotFoundException(`Automação "${key}" não existe.`);

    await this.tenantDb.db
      .insertInto('workflowSettings')
      .values({ workspaceId: this.tenantDb.workspaceId, workflowKey: key, enabled })
      .onConflict((oc) => oc.columns(['workspaceId', 'workflowKey']).doUpdateSet({ enabled, updatedAt: new Date() }))
      .execute();

    return { key, enabled };
  }

  private async isEnabled(key: string): Promise<boolean> {
    const row = await this.tenantDb.db
      .selectFrom('workflowSettings')
      .select('enabled')
      .where('workspaceId', '=', this.tenantDb.workspaceId)
      .where('workflowKey', '=', key)
      .executeTakeFirst();
    return row?.enabled ?? true;
  }

  /**
   * Disparado por OpportunitiesService.moveStage depois que o estágio muda. Só age se a
   * oportunidade continua aberta (mover pra won/lost é "fechamento", não faz sentido criar
   * follow-up) e se a automação estiver ligada neste workspace.
   */
  async handleOpportunityStageChanged(opportunity: Opportunity) {
    if (opportunity.status !== 'open') return;
    if (!(await this.isEnabled('auto_followup_task'))) return;

    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 3);

    const task = await this.tenantDb.db
      .insertInto('tasks')
      .values({
        workspaceId: this.tenantDb.workspaceId,
        subject: `Follow-up: ${opportunity.name}`,
        description: 'Criada automaticamente pelo workflow "Follow-up automático ao mudar de estágio".',
        dueDate,
        assigneeId: opportunity.ownerId,
        relatedToType: 'opportunity',
        relatedToId: opportunity.id,
        createdBy: null,
      })
      .returningAll()
      .executeTakeFirstOrThrow();

    await this.activities.log({
      type: 'system',
      relatedToType: 'opportunity',
      relatedToId: opportunity.id,
      payload: { event: 'workflow_triggered', workflowKey: 'auto_followup_task', taskId: task.id },
      actorId: null,
    });
  }
}

import { Injectable } from '@nestjs/common';
import { sql } from 'kysely';
import { TenantDb } from '../database/tenant-db.service';

interface FrtRow {
  totalInbound: string;
  repliedCount: string;
  avgFrtMinutes: string | null;
}

interface SenderRow {
  humanCount: string;
  automationCount: string;
}

export interface MessagingMetrics {
  messagesSent: number;
  firstResponseTimeMinutes: number | null;
  responseRate: number;
  bySender: { human: number; automation: number };
}

@Injectable()
export class MessagingMetricsService {
  constructor(private readonly tenantDb: TenantDb) {}

  /**
   * FRT/taxa de resposta: pra cada mensagem inbound de um contato, acha a primeira
   * mensagem outbound daquele mesmo contato depois dela (correlated subquery — ok nesta
   * escala; se o volume crescer muito vale trocar por uma window function).
   */
  async getMetrics(from: Date, to: Date): Promise<MessagingMetrics> {
    const workspaceId = this.tenantDb.workspaceId;

    const [frtResult, senderResult, sentCount] = await Promise.all([
      sql<FrtRow>`
        with inbound as (
          select id, contact_id, created_at
          from whatsapp_messages
          where workspace_id = ${workspaceId} and direction = 'inbound' and contact_id is not null
            and created_at between ${from} and ${to}
        ),
        first_reply as (
          select
            i.id,
            i.created_at as inbound_at,
            (
              select min(o.created_at) from whatsapp_messages o
              where o.workspace_id = ${workspaceId} and o.direction = 'outbound' and o.contact_id = i.contact_id
                and o.created_at > i.created_at
            ) as reply_at
          from inbound i
        )
        select
          count(*) as total_inbound,
          count(reply_at) as replied_count,
          avg(extract(epoch from (reply_at - inbound_at)) / 60) filter (where reply_at is not null) as avg_frt_minutes
        from first_reply
      `.execute(this.tenantDb.db),
      sql<SenderRow>`
        select
          count(*) filter (where a.actor_id is not null) as human_count,
          count(*) filter (where a.actor_id is null) as automation_count
        from whatsapp_messages wm
        join activities a on a.id = wm.activity_id
        where wm.workspace_id = ${workspaceId} and wm.direction = 'outbound'
          and wm.created_at between ${from} and ${to}
      `.execute(this.tenantDb.db),
      this.tenantDb.db
        .selectFrom('whatsappMessages')
        .select((eb) => eb.fn.countAll<string>().as('count'))
        .where('workspaceId', '=', workspaceId)
        .where('direction', '=', 'outbound')
        .where('createdAt', '>=', from)
        .where('createdAt', '<=', to)
        .executeTakeFirst(),
    ]);

    const frt = frtResult.rows[0];
    const totalInbound = Number(frt?.totalInbound ?? 0);
    const repliedCount = Number(frt?.repliedCount ?? 0);
    const sender = senderResult.rows[0];

    return {
      messagesSent: Number(sentCount?.count ?? 0),
      firstResponseTimeMinutes: frt?.avgFrtMinutes != null ? Math.round(Number(frt.avgFrtMinutes)) : null,
      responseRate: totalInbound > 0 ? Number(((repliedCount / totalInbound) * 100).toFixed(1)) : 0,
      bySender: { human: Number(sender?.humanCount ?? 0), automation: Number(sender?.automationCount ?? 0) },
    };
  }
}

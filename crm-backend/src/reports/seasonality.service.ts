import { Injectable } from '@nestjs/common';
import { sql } from 'kysely';
import { TenantDb } from '../database/tenant-db.service';

interface SeasonalityRow {
  season: string;
  cropType: string | null;
  opportunityCount: string;
  totalAmount: string;
  wonAmount: string;
}

@Injectable()
export class SeasonalityService {
  constructor(private readonly tenantDb: TenantDb) {}

  /** Agrupa Opportunities por safra/cultura — pra planejar vendas de sementes/insumos por época (guia agro seção "sazonalidade"). */
  async bySeason() {
    const result = await sql<SeasonalityRow>`
      select
        season,
        crop_type,
        count(*) as opportunity_count,
        coalesce(sum(amount), 0) as total_amount,
        coalesce(sum(amount) filter (where status = 'won'), 0) as won_amount
      from opportunities
      where workspace_id = ${this.tenantDb.workspaceId} and season is not null
      group by season, crop_type
      order by season desc, crop_type nulls last
    `.execute(this.tenantDb.db);

    return result.rows;
  }
}

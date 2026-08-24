import { Injectable } from '@nestjs/common';
import { TenantDb } from '../database/tenant-db.service';

@Injectable()
export class WorkspacesService {
  constructor(private readonly tenantDb: TenantDb) {}

  current() {
    return this.tenantDb.db
      .selectFrom('workspaces')
      .selectAll()
      .where('id', '=', this.tenantDb.workspaceId)
      .executeTakeFirstOrThrow();
  }
}

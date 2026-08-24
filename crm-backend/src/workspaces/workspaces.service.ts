import { Injectable } from '@nestjs/common';
import type { Json } from '../../db/types';
import { TenantDb } from '../database/tenant-db.service';
import type { UpdateBrandingDto } from './dto/update-branding.dto';

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

  /** Branding (white-label) fica dentro de workspaces.settings.branding — merge raso, não substitui o resto de settings. */
  async updateBranding(dto: UpdateBrandingDto) {
    const workspace = await this.current();
    const settings = (workspace.settings ?? {}) as Record<string, unknown>;
    const branding = (settings.branding ?? {}) as Record<string, unknown>;

    const nextBranding = { ...branding };
    if (dto.logoUrl !== undefined) nextBranding.logoUrl = dto.logoUrl;
    if (dto.primaryColor !== undefined) nextBranding.primaryColor = dto.primaryColor;
    if (dto.customDomain !== undefined) nextBranding.customDomain = dto.customDomain;

    const nextSettings: Json = { ...settings, branding: nextBranding };

    return this.tenantDb.db
      .updateTable('workspaces')
      .set({ settings: nextSettings })
      .where('id', '=', this.tenantDb.workspaceId)
      .returningAll()
      .executeTakeFirstOrThrow();
  }
}

import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { isPgUniqueViolation } from '../common/db/pg-errors';
import { TenantDb } from '../database/tenant-db.service';
import type { ConnectWhatsappDto } from './dto/connect-whatsapp.dto';

const PROVIDER = 'whatsapp';

const PUBLIC_COLUMNS = ['id', 'externalId', 'wabaId', 'displayPhone', 'status', 'createdAt', 'updatedAt'] as const;

@Injectable()
export class WhatsappConnectionService {
  constructor(private readonly tenantDb: TenantDb) {}

  async getOrNull() {
    return this.tenantDb.db
      .selectFrom('integrationConnections')
      .select(PUBLIC_COLUMNS)
      .where('workspaceId', '=', this.tenantDb.workspaceId)
      .where('provider', '=', PROVIDER)
      .executeTakeFirst();
  }

  async get() {
    const connection = await this.getOrNull();
    if (!connection) throw new NotFoundException('WhatsApp não está conectado neste workspace.');
    return connection;
  }

  /** Uso interno — inclui accessToken, que nunca deve sair pela API pública (ver PUBLIC_COLUMNS). */
  async getActiveConnectionWithToken() {
    const connection = await this.tenantDb.db
      .selectFrom('integrationConnections')
      .selectAll()
      .where('workspaceId', '=', this.tenantDb.workspaceId)
      .where('provider', '=', PROVIDER)
      .where('status', '=', 'active')
      .executeTakeFirst();
    if (!connection) {
      throw new NotFoundException('WhatsApp não está conectado (ou está desconectado) neste workspace — conecte em POST /integrations/whatsapp.');
    }
    return connection;
  }

  async connect(dto: ConnectWhatsappDto) {
    const existing = await this.getOrNull();

    try {
      if (existing) {
        return await this.tenantDb.db
          .updateTable('integrationConnections')
          .set({
            externalId: dto.phoneNumberId,
            wabaId: dto.wabaId ?? null,
            displayPhone: dto.displayPhone ?? null,
            accessToken: dto.accessToken,
            status: 'active',
            connectedBy: this.tenantDb.workspaceMemberId,
          })
          .where('id', '=', existing.id)
          .returning(PUBLIC_COLUMNS)
          .executeTakeFirstOrThrow();
      }

      return await this.tenantDb.db
        .insertInto('integrationConnections')
        .values({
          workspaceId: this.tenantDb.workspaceId,
          provider: PROVIDER,
          externalId: dto.phoneNumberId,
          wabaId: dto.wabaId ?? null,
          displayPhone: dto.displayPhone ?? null,
          accessToken: dto.accessToken,
          status: 'active',
          connectedBy: this.tenantDb.workspaceMemberId,
        })
        .returning(PUBLIC_COLUMNS)
        .executeTakeFirstOrThrow();
    } catch (err) {
      if (isPgUniqueViolation(err)) {
        throw new ConflictException('Esse número (phoneNumberId) já está conectado em outro workspace.');
      }
      throw err;
    }
  }

  async disconnect(): Promise<void> {
    const existing = await this.get();
    await this.tenantDb.db.deleteFrom('integrationConnections').where('id', '=', existing.id).execute();
  }
}

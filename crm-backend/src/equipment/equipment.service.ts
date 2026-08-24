import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import type { Updateable } from 'kysely';
import type { EquipmentTable } from '../../db/types';
import { isPgForeignKeyViolation } from '../common/db/pg-errors';
import { TenantDb } from '../database/tenant-db.service';
import type { CreateEquipmentDto } from './dto/create-equipment.dto';
import type { UpdateEquipmentDto } from './dto/update-equipment.dto';

@Injectable()
export class EquipmentService {
  constructor(private readonly tenantDb: TenantDb) {}

  list(companyId?: string) {
    let query = this.tenantDb.db.selectFrom('equipment').selectAll().where('workspaceId', '=', this.tenantDb.workspaceId);
    if (companyId) query = query.where('companyId', '=', companyId);
    return query.orderBy('createdAt', 'desc').execute();
  }

  async get(id: string) {
    const item = await this.tenantDb.db
      .selectFrom('equipment')
      .selectAll()
      .where('id', '=', id)
      .where('workspaceId', '=', this.tenantDb.workspaceId)
      .executeTakeFirst();
    if (!item) throw new NotFoundException('Equipamento não encontrado.');
    return item;
  }

  create(dto: CreateEquipmentDto) {
    return this.tenantDb.db
      .insertInto('equipment')
      .values({
        workspaceId: this.tenantDb.workspaceId,
        companyId: dto.companyId,
        productId: dto.productId ?? null,
        name: dto.name,
        manufacturer: dto.manufacturer ?? null,
        model: dto.model ?? null,
        serialNumber: dto.serialNumber ?? null,
        purchaseDate: dto.purchaseDate ?? null,
        customFields: dto.customFields ?? {},
        createdBy: this.tenantDb.workspaceMemberId,
      })
      .returningAll()
      .executeTakeFirstOrThrow();
  }

  async update(id: string, dto: UpdateEquipmentDto) {
    await this.get(id);

    const values: Updateable<EquipmentTable> = {};
    if (dto.productId !== undefined) values.productId = dto.productId;
    if (dto.name !== undefined) values.name = dto.name;
    if (dto.manufacturer !== undefined) values.manufacturer = dto.manufacturer;
    if (dto.model !== undefined) values.model = dto.model;
    if (dto.serialNumber !== undefined) values.serialNumber = dto.serialNumber;
    if (dto.purchaseDate !== undefined) values.purchaseDate = dto.purchaseDate;
    if (dto.customFields !== undefined) values.customFields = dto.customFields;
    if (dto.status !== undefined) values.status = dto.status;

    return this.tenantDb.db
      .updateTable('equipment')
      .set(values)
      .where('id', '=', id)
      .where('workspaceId', '=', this.tenantDb.workspaceId)
      .returningAll()
      .executeTakeFirstOrThrow();
  }

  async remove(id: string): Promise<void> {
    await this.get(id);
    try {
      await this.tenantDb.db.deleteFrom('equipment').where('id', '=', id).where('workspaceId', '=', this.tenantDb.workspaceId).execute();
    } catch (err) {
      if (isPgForeignKeyViolation(err)) {
        throw new ConflictException(
          'Não é possível remover: há ordens de serviço vinculadas a este equipamento. Marque como "inactive"/"sold" em vez de remover.',
        );
      }
      throw err;
    }
  }
}

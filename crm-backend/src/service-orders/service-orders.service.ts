import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import type { Updateable } from 'kysely';
import type { ServiceOrdersTable } from '../../db/types';
import { ActivitiesService } from '../activities/activities.service';
import { TenantDb } from '../database/tenant-db.service';
import { InventoryMovementsService } from '../inventory/inventory-movements.service';
import type { AddServiceOrderPartDto } from './dto/add-service-order-part.dto';
import type { CreateServiceOrderDto } from './dto/create-service-order.dto';
import type { UpdateServiceOrderDto } from './dto/update-service-order.dto';

export interface ServiceOrderFilters {
  companyId?: string;
  status?: string;
  technicianId?: string;
}

const CLOSED_STATUSES = ['completed', 'cancelled'];

@Injectable()
export class ServiceOrdersService {
  constructor(
    private readonly tenantDb: TenantDb,
    private readonly activities: ActivitiesService,
    private readonly inventory: InventoryMovementsService,
  ) {}

  list(filters: ServiceOrderFilters) {
    let query = this.tenantDb.db.selectFrom('serviceOrders').selectAll().where('workspaceId', '=', this.tenantDb.workspaceId);
    if (filters.companyId) query = query.where('companyId', '=', filters.companyId);
    if (filters.status) query = query.where('status', '=', filters.status);
    if (filters.technicianId) query = query.where('technicianId', '=', filters.technicianId);
    return query.orderBy('createdAt', 'desc').execute();
  }

  async get(id: string) {
    const order = await this.tenantDb.db
      .selectFrom('serviceOrders')
      .selectAll()
      .where('id', '=', id)
      .where('workspaceId', '=', this.tenantDb.workspaceId)
      .executeTakeFirst();
    if (!order) throw new NotFoundException('Ordem de serviço não encontrada.');
    return order;
  }

  async create(dto: CreateServiceOrderDto) {
    const order = await this.tenantDb.db
      .insertInto('serviceOrders')
      .values({
        workspaceId: this.tenantDb.workspaceId,
        companyId: dto.companyId,
        contactId: dto.contactId ?? null,
        equipmentId: dto.equipmentId ?? null,
        type: dto.type ?? 'maintenance',
        description: dto.description ?? null,
        technicianId: dto.technicianId ?? null,
        scheduledDate: dto.scheduledDate ? new Date(dto.scheduledDate) : null,
        createdBy: this.tenantDb.workspaceMemberId,
      })
      .returningAll()
      .executeTakeFirstOrThrow();

    await this.activities.log({
      type: 'system',
      relatedToType: 'service_order',
      relatedToId: order.id,
      payload: { event: 'created', equipmentId: order.equipmentId, type: order.type },
    });

    return order;
  }

  async update(id: string, dto: UpdateServiceOrderDto) {
    const current = await this.get(id);
    if (CLOSED_STATUSES.includes(current.status)) {
      throw new ConflictException('Ordem de serviço já encerrada — não é possível editar.');
    }

    const values: Updateable<ServiceOrdersTable> = {};
    if (dto.contactId !== undefined) values.contactId = dto.contactId;
    if (dto.equipmentId !== undefined) values.equipmentId = dto.equipmentId;
    if (dto.type !== undefined) values.type = dto.type;
    if (dto.description !== undefined) values.description = dto.description;
    if (dto.technicianId !== undefined) values.technicianId = dto.technicianId;
    if (dto.scheduledDate !== undefined) values.scheduledDate = new Date(dto.scheduledDate);

    return this.tenantDb.db
      .updateTable('serviceOrders')
      .set(values)
      .where('id', '=', id)
      .where('workspaceId', '=', this.tenantDb.workspaceId)
      .returningAll()
      .executeTakeFirstOrThrow();
  }

  async start(id: string) {
    const order = await this.get(id);
    if (order.status !== 'open') throw new ConflictException('Só é possível iniciar uma ordem de serviço "open".');
    return this.setStatus(id, 'in_progress');
  }

  async cancel(id: string) {
    const order = await this.get(id);
    if (CLOSED_STATUSES.includes(order.status)) throw new ConflictException('Ordem de serviço já encerrada.');
    return this.setStatus(id, 'cancelled');
  }

  /** Conclui a ordem e debita do estoque as peças usadas (ver InventoryMovementsService). */
  async complete(id: string) {
    const order = await this.get(id);
    if (CLOSED_STATUSES.includes(order.status)) throw new ConflictException('Ordem de serviço já encerrada.');

    const parts = await this.listParts(id);
    for (const part of parts) {
      await this.inventory.recordMovement({
        productId: part.productId,
        type: 'service_use',
        quantityDelta: -Number(part.quantity),
        relatedToType: 'service_order',
        relatedToId: id,
        note: part.description,
      });
    }

    const updated = await this.tenantDb.db
      .updateTable('serviceOrders')
      .set({ status: 'completed', completedAt: new Date() })
      .where('id', '=', id)
      .where('workspaceId', '=', this.tenantDb.workspaceId)
      .returningAll()
      .executeTakeFirstOrThrow();

    await this.activities.log({
      type: 'system',
      relatedToType: 'service_order',
      relatedToId: id,
      payload: { event: 'completed', partsUsed: parts.length },
    });

    return updated;
  }

  private setStatus(id: string, status: string) {
    return this.tenantDb.db
      .updateTable('serviceOrders')
      .set({ status })
      .where('id', '=', id)
      .where('workspaceId', '=', this.tenantDb.workspaceId)
      .returningAll()
      .executeTakeFirstOrThrow();
  }

  // ---- peças ----

  listParts(serviceOrderId: string) {
    return this.tenantDb.db
      .selectFrom('serviceOrderParts')
      .selectAll()
      .where('workspaceId', '=', this.tenantDb.workspaceId)
      .where('serviceOrderId', '=', serviceOrderId)
      .orderBy('createdAt', 'asc')
      .execute();
  }

  async addPart(serviceOrderId: string, dto: AddServiceOrderPartDto) {
    const order = await this.get(serviceOrderId);
    if (CLOSED_STATUSES.includes(order.status)) {
      throw new ConflictException('Ordem de serviço já encerrada — não é possível adicionar peças.');
    }

    const product = await this.tenantDb.db
      .selectFrom('products')
      .selectAll()
      .where('id', '=', dto.productId)
      .where('workspaceId', '=', this.tenantDb.workspaceId)
      .executeTakeFirst();
    if (!product) throw new NotFoundException('Produto não encontrado.');

    return this.tenantDb.db
      .insertInto('serviceOrderParts')
      .values({
        workspaceId: this.tenantDb.workspaceId,
        serviceOrderId,
        productId: dto.productId,
        description: dto.description ?? product.name,
        quantity: String(dto.quantity),
        unitPrice: dto.unitPrice !== undefined ? String(dto.unitPrice) : product.price,
      })
      .returningAll()
      .executeTakeFirstOrThrow();
  }

  async removePart(serviceOrderId: string, partId: string): Promise<void> {
    const order = await this.get(serviceOrderId);
    if (CLOSED_STATUSES.includes(order.status)) {
      throw new ConflictException('Ordem de serviço já encerrada — não é possível remover peças.');
    }

    const part = await this.tenantDb.db
      .selectFrom('serviceOrderParts')
      .select('id')
      .where('id', '=', partId)
      .where('serviceOrderId', '=', serviceOrderId)
      .where('workspaceId', '=', this.tenantDb.workspaceId)
      .executeTakeFirst();
    if (!part) throw new NotFoundException('Peça não encontrada nesta ordem de serviço.');

    await this.tenantDb.db.deleteFrom('serviceOrderParts').where('id', '=', partId).execute();
  }
}

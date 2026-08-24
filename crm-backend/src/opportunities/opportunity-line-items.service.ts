import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { ActivitiesService } from '../activities/activities.service';
import { TenantDb } from '../database/tenant-db.service';
import { InventoryMovementsService } from '../inventory/inventory-movements.service';
import type { AddLineItemDto } from './dto/add-line-item.dto';

@Injectable()
export class OpportunityLineItemsService {
  constructor(
    private readonly tenantDb: TenantDb,
    private readonly activities: ActivitiesService,
    private readonly inventory: InventoryMovementsService,
  ) {}

  list(opportunityId: string) {
    return this.tenantDb.db
      .selectFrom('opportunityLineItems')
      .selectAll()
      .where('workspaceId', '=', this.tenantDb.workspaceId)
      .where('opportunityId', '=', opportunityId)
      .orderBy('createdAt', 'asc')
      .execute();
  }

  private async getOpenOpportunity(opportunityId: string) {
    const opportunity = await this.tenantDb.db
      .selectFrom('opportunities')
      .selectAll()
      .where('id', '=', opportunityId)
      .where('workspaceId', '=', this.tenantDb.workspaceId)
      .executeTakeFirst();
    if (!opportunity) throw new NotFoundException('Oportunidade não encontrada.');
    if (opportunity.status !== 'open') {
      throw new ConflictException('Oportunidade fechada: reabra (/reopen) antes de editar os itens de linha.');
    }
    return opportunity;
  }

  async add(opportunityId: string, dto: AddLineItemDto) {
    await this.getOpenOpportunity(opportunityId);

    if (dto.productId) {
      const product = await this.tenantDb.db
        .selectFrom('products')
        .select('id')
        .where('id', '=', dto.productId)
        .where('workspaceId', '=', this.tenantDb.workspaceId)
        .executeTakeFirst();
      if (!product) throw new NotFoundException('Produto não encontrado.');
    }

    const lineItem = await this.tenantDb.db
      .insertInto('opportunityLineItems')
      .values({
        workspaceId: this.tenantDb.workspaceId,
        opportunityId,
        productId: dto.productId ?? null,
        description: dto.description,
        quantity: String(dto.quantity),
        unitPrice: String(dto.unitPrice),
      })
      .returningAll()
      .executeTakeFirstOrThrow();

    await this.recomputeAmount(opportunityId);
    await this.activities.log({
      type: 'field_change',
      relatedToType: 'opportunity',
      relatedToId: opportunityId,
      payload: { event: 'line_item_added', description: dto.description, quantity: dto.quantity, unitPrice: dto.unitPrice },
    });

    return lineItem;
  }

  async remove(opportunityId: string, lineItemId: string): Promise<void> {
    await this.getOpenOpportunity(opportunityId);

    const lineItem = await this.tenantDb.db
      .selectFrom('opportunityLineItems')
      .selectAll()
      .where('id', '=', lineItemId)
      .where('opportunityId', '=', opportunityId)
      .where('workspaceId', '=', this.tenantDb.workspaceId)
      .executeTakeFirst();
    if (!lineItem) throw new NotFoundException('Item de linha não encontrado.');

    await this.tenantDb.db.deleteFrom('opportunityLineItems').where('id', '=', lineItemId).execute();
    await this.recomputeAmount(opportunityId);
    await this.activities.log({
      type: 'field_change',
      relatedToType: 'opportunity',
      relatedToId: opportunityId,
      payload: { event: 'line_item_removed', description: lineItem.description },
    });
  }

  private async recomputeAmount(opportunityId: string): Promise<void> {
    const total = await this.tenantDb.db
      .selectFrom('opportunityLineItems')
      .select((eb) => eb.fn.sum<string>('subtotal').as('total'))
      .where('opportunityId', '=', opportunityId)
      .executeTakeFirst();

    await this.tenantDb.db
      .updateTable('opportunities')
      .set({ amount: total?.total ?? '0' })
      .where('id', '=', opportunityId)
      .execute();
  }

  /**
   * Chamado por OpportunitiesService.moveStage quando o novo estágio é "won" — debita
   * estoque de cada item de linha com productId (itens de texto livre, sem productId, não
   * mexem em estoque). Reabrir e vender de novo debita de novo — não há reversão automática
   * ao reabrir um deal ganho, ver nota em OpportunitiesService.
   */
  async processWinInventory(opportunityId: string): Promise<void> {
    const lineItems = await this.list(opportunityId);
    for (const item of lineItems) {
      if (!item.productId) continue;
      await this.inventory.recordMovement({
        productId: item.productId,
        type: 'sale',
        quantityDelta: -Number(item.quantity),
        relatedToType: 'opportunity',
        relatedToId: opportunityId,
        note: item.description,
      });
    }
  }
}

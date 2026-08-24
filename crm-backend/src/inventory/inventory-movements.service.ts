import { Injectable, NotFoundException } from '@nestjs/common';
import { TenantDb } from '../database/tenant-db.service';

export interface RecordMovementParams {
  productId: string;
  type: 'sale' | 'service_use' | 'adjustment' | 'restock';
  /** Negativo = saída de estoque, positivo = entrada. */
  quantityDelta: number;
  relatedToType?: 'opportunity' | 'service_order';
  relatedToId?: string;
  note?: string;
}

@Injectable()
export class InventoryMovementsService {
  constructor(private readonly tenantDb: TenantDb) {}

  listForProduct(productId: string) {
    return this.tenantDb.db
      .selectFrom('inventoryMovements')
      .selectAll()
      .where('workspaceId', '=', this.tenantDb.workspaceId)
      .where('productId', '=', productId)
      .orderBy('createdAt', 'desc')
      .execute();
  }

  /**
   * Registra o movimento e atualiza products.stock_quantity na mesma transação da
   * request — produtos com trackStock=false (tipicamente category='service') não têm
   * estoque nenhum pra mexer, então o movimento nem é gravado.
   */
  async recordMovement(params: RecordMovementParams): Promise<void> {
    const product = await this.tenantDb.db
      .selectFrom('products')
      .select(['id', 'trackStock'])
      .where('id', '=', params.productId)
      .where('workspaceId', '=', this.tenantDb.workspaceId)
      .executeTakeFirst();
    if (!product) throw new NotFoundException('Produto não encontrado.');
    if (!product.trackStock) return;

    await this.tenantDb.db
      .insertInto('inventoryMovements')
      .values({
        workspaceId: this.tenantDb.workspaceId,
        productId: params.productId,
        type: params.type,
        quantityDelta: String(params.quantityDelta),
        relatedToType: params.relatedToType ?? null,
        relatedToId: params.relatedToId ?? null,
        actorId: this.tenantDb.workspaceMemberId,
        note: params.note ?? null,
      })
      .execute();

    await this.tenantDb.db
      .updateTable('products')
      .set((eb) => ({ stockQuantity: eb('stockQuantity', '+', String(params.quantityDelta)) }))
      .where('id', '=', params.productId)
      .execute();
  }
}

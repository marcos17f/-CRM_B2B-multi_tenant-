import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import type { Updateable } from 'kysely';
import type { ProductsTable } from '../../db/types';
import { isPgUniqueViolation } from '../common/db/pg-errors';
import { TenantDb } from '../database/tenant-db.service';
import { InventoryMovementsService } from '../inventory/inventory-movements.service';
import type { CreateProductDto } from './dto/create-product.dto';
import type { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductsService {
  constructor(
    private readonly tenantDb: TenantDb,
    private readonly inventory: InventoryMovementsService,
  ) {}

  list(category?: string) {
    let query = this.tenantDb.db.selectFrom('products').selectAll().where('workspaceId', '=', this.tenantDb.workspaceId);
    if (category) query = query.where('category', '=', category);
    return query.orderBy('name').execute();
  }

  async get(id: string) {
    const product = await this.tenantDb.db
      .selectFrom('products')
      .selectAll()
      .where('id', '=', id)
      .where('workspaceId', '=', this.tenantDb.workspaceId)
      .executeTakeFirst();
    if (!product) throw new NotFoundException('Produto não encontrado.');
    return product;
  }

  async create(dto: CreateProductDto) {
    const trackStock = dto.trackStock ?? dto.category !== 'service';
    try {
      return await this.tenantDb.db
        .insertInto('products')
        .values({
          workspaceId: this.tenantDb.workspaceId,
          sku: dto.sku,
          name: dto.name,
          category: dto.category,
          unit: dto.unit ?? 'un',
          price: dto.price !== undefined ? String(dto.price) : '0',
          trackStock,
          stockQuantity: dto.stockQuantity !== undefined ? String(dto.stockQuantity) : '0',
          customFields: dto.customFields ?? {},
          createdBy: this.tenantDb.workspaceMemberId,
        })
        .returningAll()
        .executeTakeFirstOrThrow();
    } catch (err) {
      if (isPgUniqueViolation(err)) throw new ConflictException('Já existe um produto com esse SKU neste workspace.');
      throw err;
    }
  }

  async update(id: string, dto: UpdateProductDto) {
    await this.get(id);

    const values: Updateable<ProductsTable> = {};
    if (dto.sku !== undefined) values.sku = dto.sku;
    if (dto.name !== undefined) values.name = dto.name;
    if (dto.category !== undefined) values.category = dto.category;
    if (dto.unit !== undefined) values.unit = dto.unit;
    if (dto.price !== undefined) values.price = String(dto.price);
    if (dto.trackStock !== undefined) values.trackStock = dto.trackStock;
    if (dto.customFields !== undefined) values.customFields = dto.customFields;
    if (dto.status !== undefined) values.status = dto.status;

    try {
      return await this.tenantDb.db
        .updateTable('products')
        .set(values)
        .where('id', '=', id)
        .where('workspaceId', '=', this.tenantDb.workspaceId)
        .returningAll()
        .executeTakeFirstOrThrow();
    } catch (err) {
      if (isPgUniqueViolation(err)) throw new ConflictException('Já existe um produto com esse SKU neste workspace.');
      throw err;
    }
  }

  listMovements(id: string) {
    return this.inventory.listForProduct(id);
  }

  async adjustStock(id: string, quantityDelta: number, type: 'adjustment' | 'restock', note?: string) {
    await this.get(id);
    await this.inventory.recordMovement({ productId: id, type, quantityDelta, note });
    return this.get(id);
  }
}

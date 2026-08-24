import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import { RequirePermission } from '../common/decorators/require-permission.decorator';
import { PERMISSIONS } from '../common/permissions/catalog';
import { AdjustStockDto } from './dto/adjust-stock.dto';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductsService } from './products.service';

@Controller('products')
export class ProductsController {
  constructor(private readonly products: ProductsService) {}

  @Get()
  @RequirePermission(PERMISSIONS.PRODUCTS_READ)
  list(@Query('category') category?: string) {
    return this.products.list(category);
  }

  @Get(':id')
  @RequirePermission(PERMISSIONS.PRODUCTS_READ)
  get(@Param('id', ParseUUIDPipe) id: string) {
    return this.products.get(id);
  }

  @Post()
  @RequirePermission(PERMISSIONS.PRODUCTS_WRITE)
  create(@Body() dto: CreateProductDto) {
    return this.products.create(dto);
  }

  @Patch(':id')
  @RequirePermission(PERMISSIONS.PRODUCTS_WRITE)
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateProductDto) {
    return this.products.update(id, dto);
  }

  @Get(':id/movements')
  @RequirePermission(PERMISSIONS.PRODUCTS_READ)
  movements(@Param('id', ParseUUIDPipe) id: string) {
    return this.products.listMovements(id);
  }

  /** Correção/reposição de estoque — fica auditado em inventory_movements. */
  @Post(':id/movements')
  @RequirePermission(PERMISSIONS.PRODUCTS_WRITE)
  adjustStock(@Param('id', ParseUUIDPipe) id: string, @Body() dto: AdjustStockDto) {
    return this.products.adjustStock(id, dto.quantityDelta, dto.type ?? 'adjustment', dto.note);
  }
}

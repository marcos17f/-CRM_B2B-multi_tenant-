import { OmitType, PartialType } from '@nestjs/swagger';
import { IsIn, IsOptional } from 'class-validator';
import { CreateProductDto } from './create-product.dto';

// stockQuantity fica de fora do update: correção de estoque passa por POST
// /products/:id/movements (ProductsService.adjustStock), que fica auditado em
// inventory_movements — só é setável direto na criação.
export class UpdateProductDto extends PartialType(OmitType(CreateProductDto, ['stockQuantity'] as const)) {
  @IsOptional()
  @IsIn(['active', 'discontinued'])
  status?: string;
}

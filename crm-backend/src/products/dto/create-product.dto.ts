import { IsBoolean, IsIn, IsNumber, IsObject, IsOptional, IsString, Min, MinLength } from 'class-validator';

export const PRODUCT_CATEGORIES = ['machine', 'seed', 'grain', 'part', 'service'] as const;

export class CreateProductDto {
  @IsString()
  @MinLength(1)
  sku!: string;

  @IsString()
  @MinLength(1)
  name!: string;

  @IsIn(PRODUCT_CATEGORIES)
  category!: (typeof PRODUCT_CATEGORIES)[number];

  @IsOptional()
  @IsString()
  unit?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number;

  /** Default: false pra category='service', true pro resto (máquina/semente/grão/peça). */
  @IsOptional()
  @IsBoolean()
  trackStock?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(0)
  stockQuantity?: number;

  @IsOptional()
  @IsObject()
  customFields?: Record<string, unknown>;
}

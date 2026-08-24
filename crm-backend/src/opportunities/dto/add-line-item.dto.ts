import { IsNumber, IsOptional, IsPositive, IsString, IsUUID, Min, MinLength } from 'class-validator';

export class AddLineItemDto {
  @IsOptional()
  @IsUUID()
  productId?: string;

  @IsString()
  @MinLength(1)
  description!: string;

  @IsNumber()
  @IsPositive()
  quantity!: number;

  @IsNumber()
  @Min(0)
  unitPrice!: number;
}

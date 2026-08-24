import { IsNumber, IsOptional, IsPositive, IsString, IsUUID, Min } from 'class-validator';

export class AddServiceOrderPartDto {
  @IsUUID()
  productId!: string;

  /** Default: nome do produto, se omitido. */
  @IsOptional()
  @IsString()
  description?: string;

  @IsNumber()
  @IsPositive()
  quantity!: number;

  /** Default: preço de tabela do produto, se omitido. */
  @IsOptional()
  @IsNumber()
  @Min(0)
  unitPrice?: number;
}

import { IsIn, IsNumber, IsOptional, IsString } from 'class-validator';

export class AdjustStockDto {
  /** Negativo = saída, positivo = entrada. */
  @IsNumber()
  quantityDelta!: number;

  @IsOptional()
  @IsIn(['adjustment', 'restock'])
  type?: 'adjustment' | 'restock';

  @IsOptional()
  @IsString()
  note?: string;
}

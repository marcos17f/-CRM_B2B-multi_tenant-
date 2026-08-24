import { IsDateString, IsObject, IsOptional, IsString, IsUUID, MinLength } from 'class-validator';

export class CreateEquipmentDto {
  @IsUUID()
  companyId!: string;

  /** Referência ao modelo no catálogo (products, category='machine'), se cadastrado lá. */
  @IsOptional()
  @IsUUID()
  productId?: string;

  @IsString()
  @MinLength(1)
  name!: string;

  @IsOptional()
  @IsString()
  manufacturer?: string;

  @IsOptional()
  @IsString()
  model?: string;

  @IsOptional()
  @IsString()
  serialNumber?: string;

  @IsOptional()
  @IsDateString()
  purchaseDate?: string;

  @IsOptional()
  @IsObject()
  customFields?: Record<string, unknown>;
}

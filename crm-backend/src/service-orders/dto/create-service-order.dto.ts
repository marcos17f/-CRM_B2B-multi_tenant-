import { IsDateString, IsIn, IsOptional, IsString, IsUUID } from 'class-validator';

export const SERVICE_ORDER_TYPES = ['maintenance', 'repair', 'installation', 'inspection'] as const;

export class CreateServiceOrderDto {
  @IsUUID()
  companyId!: string;

  @IsOptional()
  @IsUUID()
  contactId?: string;

  @IsOptional()
  @IsUUID()
  equipmentId?: string;

  @IsOptional()
  @IsIn(SERVICE_ORDER_TYPES)
  type?: (typeof SERVICE_ORDER_TYPES)[number];

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsUUID()
  technicianId?: string;

  @IsOptional()
  @IsDateString()
  scheduledDate?: string;
}

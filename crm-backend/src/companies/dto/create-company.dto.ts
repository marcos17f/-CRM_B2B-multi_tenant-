import { IsIn, IsInt, IsNumber, IsObject, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export class CreateCompanyDto {
  @IsString()
  name!: string;

  @IsOptional() @IsString()
  domain?: string;

  @IsOptional() @IsString()
  industry?: string;

  @IsOptional() @IsInt() @Min(0)
  employeeCount?: number;

  @IsOptional() @IsNumber()
  annualRevenue?: number;

  @IsOptional() @IsIn(['prospect', 'customer', 'churned'])
  status?: string;

  @IsOptional() @IsUUID()
  ownerId?: string;

  @IsOptional() @IsObject()
  customFields?: Record<string, unknown>;
}

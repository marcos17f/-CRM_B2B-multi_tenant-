import { IsDateString, IsIn, IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export class CreateOpportunityDto {
  @IsString()
  name!: string;

  @IsUUID()
  companyId!: string;

  @IsOptional() @IsUUID()
  primaryContactId?: string;

  @IsUUID()
  pipelineId!: string;

  @IsUUID()
  stageId!: string;

  @IsOptional() @IsIn(['new_business', 'upsell', 'renewal'])
  type?: string;

  @IsOptional() @IsNumber() @Min(0)
  amount?: number;

  @IsOptional() @IsString()
  currency?: string;

  @IsOptional() @IsUUID()
  sourceCampaignId?: string;

  @IsOptional() @IsUUID()
  ownerId?: string;

  @IsOptional() @IsDateString()
  expectedCloseDate?: string;

  /** Sazonalidade agrícola (ex.: "2026/2027") — pra planejar vendas de sementes/insumos por época. */
  @IsOptional() @IsString()
  season?: string;

  @IsOptional() @IsString()
  cropType?: string;
}

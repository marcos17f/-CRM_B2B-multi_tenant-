import { IsDateString, IsIn, IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator';

// Note que stageId e status NÃO estão aqui de propósito — mudança de estágio/fechamento
// passa por /move-stage e /reopen, que aplicam as regras de negócio (ver OpportunitiesService).
export class UpdateOpportunityDto {
  @IsOptional() @IsString()
  name?: string;

  @IsOptional() @IsUUID()
  primaryContactId?: string;

  @IsOptional() @IsNumber() @Min(0)
  amount?: number;

  @IsOptional() @IsString()
  currency?: string;

  @IsOptional() @IsUUID()
  ownerId?: string;

  @IsOptional() @IsIn(['new_business', 'upsell', 'renewal'])
  type?: string;

  @IsOptional() @IsIn(['low', 'medium', 'high'])
  riskLevel?: string;

  @IsOptional() @IsDateString()
  expectedCloseDate?: string;
}

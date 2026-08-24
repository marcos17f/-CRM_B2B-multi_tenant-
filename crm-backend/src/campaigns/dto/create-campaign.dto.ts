import { IsDateString, IsIn, IsNumber, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateCampaignDto {
  @IsString()
  name!: string;

  @IsIn(['outbound', 'email', 'ads', 'event', 'referral', 'other'])
  type!: string;

  @IsOptional() @IsIn(['draft', 'active', 'paused', 'ended'])
  status?: string;

  @IsOptional() @IsUUID()
  ownerId?: string;

  @IsOptional() @IsDateString()
  startsAt?: string;

  @IsOptional() @IsDateString()
  endsAt?: string;

  @IsOptional() @IsNumber()
  budget?: number;
}

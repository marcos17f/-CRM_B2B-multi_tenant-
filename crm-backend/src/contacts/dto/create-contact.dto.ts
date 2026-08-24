import { IsEmail, IsObject, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateContactDto {
  @IsString()
  firstName!: string;

  @IsOptional() @IsString()
  lastName?: string;

  @IsOptional() @IsEmail()
  email?: string;

  @IsOptional() @IsString()
  phone?: string;

  @IsOptional() @IsString()
  title?: string;

  @IsOptional() @IsUUID()
  companyId?: string;

  @IsOptional() @IsUUID()
  sourceCampaignId?: string;

  @IsOptional() @IsUUID()
  ownerId?: string;

  @IsOptional() @IsObject()
  customFields?: Record<string, unknown>;
}

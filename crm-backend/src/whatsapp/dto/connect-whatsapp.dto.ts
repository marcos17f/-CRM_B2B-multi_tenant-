import { IsOptional, IsString, MinLength } from 'class-validator';

export class ConnectWhatsappDto {
  /** phone_number_id do Meta Cloud API — chave de roteamento usada pelo webhook. */
  @IsString()
  @MinLength(1)
  phoneNumberId!: string;

  @IsOptional()
  @IsString()
  wabaId?: string;

  @IsOptional()
  @IsString()
  displayPhone?: string;

  @IsString()
  @MinLength(1)
  accessToken!: string;
}

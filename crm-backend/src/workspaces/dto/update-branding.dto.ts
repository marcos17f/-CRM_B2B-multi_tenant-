import { IsOptional, IsString, IsUrl, Matches, MaxLength } from 'class-validator';

export class UpdateBrandingDto {
  @IsOptional()
  @IsUrl()
  logoUrl?: string;

  @IsOptional()
  @Matches(/^#[0-9a-fA-F]{6}$/, { message: 'primaryColor deve ser um hex de 6 dígitos, ex.: #1a73e8' })
  primaryColor?: string;

  /**
   * Domínio pretendido pro white-label (ex.: "crm.clientex.com.br"). Fica só armazenado
   * aqui — apontar DNS/reverse proxy pra esse domínio é trabalho de infraestrutura fora
   * deste backend.
   */
  @IsOptional()
  @IsString()
  @MaxLength(255)
  customDomain?: string;
}

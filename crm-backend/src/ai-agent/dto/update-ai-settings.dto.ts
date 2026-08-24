import { IsBoolean, IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateAiSettingsDto {
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @IsOptional()
  @IsBoolean()
  agentEnabled?: boolean;

  /** Omitir mantém a chave já salva — só sobrescreve quando enviado. */
  @IsOptional()
  @IsString()
  @MinLength(1)
  apiKey?: string;

  @IsOptional()
  @IsString()
  model?: string;

  @IsOptional()
  @IsBoolean()
  thinkingMode?: boolean;

  @IsOptional()
  @IsBoolean()
  searchGrounding?: boolean;

  @IsOptional()
  @IsBoolean()
  lgpdConsent?: boolean;

  @IsOptional()
  @IsString()
  telegramBotToken?: string;

  @IsOptional()
  @IsString()
  telegramChatId?: string;
}

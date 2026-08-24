import { IsOptional, IsString, IsUUID } from 'class-validator';

export class MoveStageDto {
  @IsUUID()
  stageId!: string;

  /** Obrigatório quando o estágio de destino é do tipo "lost". */
  @IsOptional() @IsString()
  lostReason?: string;
}

import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, IsBoolean, IsIn, IsInt, IsNumber, IsOptional, IsString, Max, Min, ValidateNested } from 'class-validator';

class PipelineStageDto {
  @IsString()
  name!: string;

  @IsInt()
  @Min(0)
  orderIndex!: number;

  @IsNumber()
  @Min(0)
  @Max(1)
  probability!: number;

  @IsIn(['open', 'won', 'lost'])
  stageType!: string;
}

export class CreatePipelineDto {
  @IsString()
  name!: string;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;

  @IsArray()
  @ArrayMinSize(2, { message: 'defina pelo menos um estágio final de ganho e um de perda' })
  @ValidateNested({ each: true })
  @Type(() => PipelineStageDto)
  stages!: PipelineStageDto[];
}

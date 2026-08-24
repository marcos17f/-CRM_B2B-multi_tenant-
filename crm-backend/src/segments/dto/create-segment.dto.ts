import { IsIn, IsObject, IsOptional, IsString } from 'class-validator';

export class CreateSegmentDto {
  @IsString()
  name!: string;

  @IsIn(['manual', 'smart'])
  type!: 'manual' | 'smart';

  /**
   * Só pra segmentos "smart". Chaves aceitas: rfmSegment, industry, status,
   * monetaryScoreGte, frequencyScoreGte, recencyScoreGte (ver SegmentsService).
   */
  @IsOptional()
  @IsObject()
  criteria?: Record<string, unknown>;
}

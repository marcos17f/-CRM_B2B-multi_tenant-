import { IsInt, IsOptional, Max, Min } from 'class-validator';

export class RecomputeRfmDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(60)
  periodMonths?: number;
}

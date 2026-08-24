import { IsString } from 'class-validator';

export class ChangePlanDto {
  @IsString()
  planId!: string;
}

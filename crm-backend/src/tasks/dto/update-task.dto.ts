import { IsDateString, IsOptional, IsString, IsUUID } from 'class-validator';

export class UpdateTaskDto {
  @IsOptional() @IsString()
  subject?: string;

  @IsOptional() @IsString()
  description?: string;

  @IsOptional() @IsDateString()
  dueDate?: string;

  @IsOptional() @IsUUID()
  assigneeId?: string;
}

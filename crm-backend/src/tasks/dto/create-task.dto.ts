import { IsDateString, IsIn, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateTaskDto {
  @IsString()
  subject!: string;

  @IsOptional() @IsString()
  description?: string;

  @IsOptional() @IsDateString()
  dueDate?: string;

  @IsOptional() @IsUUID()
  assigneeId?: string;

  @IsIn(['company', 'contact', 'opportunity'])
  relatedToType!: string;

  @IsUUID()
  relatedToId!: string;
}

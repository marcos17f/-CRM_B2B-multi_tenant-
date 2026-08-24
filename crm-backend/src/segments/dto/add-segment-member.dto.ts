import { IsUUID } from 'class-validator';

export class AddSegmentMemberDto {
  @IsUUID()
  companyId!: string;
}

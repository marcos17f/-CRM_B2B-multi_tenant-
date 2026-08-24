import { IsString, IsUUID } from 'class-validator';

export class SelectWorkspaceDto {
  @IsString()
  preAuthToken!: string;

  @IsUUID()
  workspaceId!: string;
}

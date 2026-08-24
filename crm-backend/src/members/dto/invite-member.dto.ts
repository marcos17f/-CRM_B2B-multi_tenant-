import { IsEmail, IsIn, IsOptional, IsString } from 'class-validator';

// 'owner' não é atribuível por convite — só existe um por criação de workspace (por ora;
// transferência de ownership é um caso de uso a mais que a seção de Permissões pode cobrir).
export class InviteMemberDto {
  @IsEmail()
  email!: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsIn(['admin', 'sales_rep', 'read_only'])
  roleName!: string;
}

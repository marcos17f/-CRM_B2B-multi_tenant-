import { IsEmail, IsString, Matches, MinLength } from 'class-validator';

export class RegisterDto {
  @IsString()
  @MinLength(2)
  workspaceName!: string;

  @IsString()
  @Matches(/^[a-z0-9-]{3,63}$/, {
    message: 'workspaceSlug deve ter 3-63 caracteres: letras minúsculas, números e hífen',
  })
  workspaceSlug!: string;

  @IsString()
  @MinLength(2)
  name!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  password!: string;
}

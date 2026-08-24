import { IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

export class SendWhatsappMessageDto {
  @IsUUID()
  contactId!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(4096)
  message!: string;
}

import { Body, Controller, Post } from '@nestjs/common';
import { RequirePermission } from '../common/decorators/require-permission.decorator';
import { PERMISSIONS } from '../common/permissions/catalog';
import { SendWhatsappMessageDto } from './dto/send-whatsapp-message.dto';
import { WhatsappMessagingService } from './whatsapp-messaging.service';

@Controller('whatsapp')
export class WhatsappMessagingController {
  constructor(private readonly messaging: WhatsappMessagingService) {}

  @Post('send')
  @RequirePermission(PERMISSIONS.WHATSAPP_SEND)
  send(@Body() dto: SendWhatsappMessageDto) {
    return this.messaging.send(dto);
  }
}

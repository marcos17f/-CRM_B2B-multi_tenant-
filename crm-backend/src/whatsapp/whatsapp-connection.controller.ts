import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { RequirePermission } from '../common/decorators/require-permission.decorator';
import { PERMISSIONS } from '../common/permissions/catalog';
import { ConnectWhatsappDto } from './dto/connect-whatsapp.dto';
import { WhatsappConnectionService } from './whatsapp-connection.service';

@Controller('integrations/whatsapp')
export class WhatsappConnectionController {
  constructor(private readonly connection: WhatsappConnectionService) {}

  @Get()
  @RequirePermission(PERMISSIONS.INTEGRATIONS_MANAGE)
  get() {
    return this.connection.get();
  }

  @Post()
  @RequirePermission(PERMISSIONS.INTEGRATIONS_MANAGE)
  connect(@Body() dto: ConnectWhatsappDto) {
    return this.connection.connect(dto);
  }

  @Delete()
  @RequirePermission(PERMISSIONS.INTEGRATIONS_MANAGE)
  @HttpCode(HttpStatus.NO_CONTENT)
  disconnect() {
    return this.connection.disconnect();
  }
}

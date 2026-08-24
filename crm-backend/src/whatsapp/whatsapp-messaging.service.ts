import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ActivitiesService } from '../activities/activities.service';
import { TenantDb } from '../database/tenant-db.service';
import type { SendWhatsappMessageDto } from './dto/send-whatsapp-message.dto';
import { WhatsappConnectionService } from './whatsapp-connection.service';
import { sendWhatsappTextMessage } from './whatsapp-graph-client';
import { normalizeWhatsappPhone } from './whatsapp-phone.util';

@Injectable()
export class WhatsappMessagingService {
  constructor(
    private readonly tenantDb: TenantDb,
    private readonly connection: WhatsappConnectionService,
    private readonly activities: ActivitiesService,
    private readonly config: ConfigService,
  ) {}

  async send(dto: SendWhatsappMessageDto) {
    const contact = await this.tenantDb.db
      .selectFrom('contacts')
      .selectAll()
      .where('id', '=', dto.contactId)
      .where('workspaceId', '=', this.tenantDb.workspaceId)
      .where('deletedAt', 'is', null)
      .executeTakeFirst();
    if (!contact) throw new NotFoundException('Contato não encontrado.');
    if (!contact.phone) throw new BadRequestException('Contato não tem telefone cadastrado — não é possível enviar WhatsApp.');

    const connection = await this.connection.getActiveConnectionWithToken();
    const graphApiVersion = this.config.get<string>('WHATSAPP_GRAPH_API_VERSION') ?? 'v20.0';

    const { wamid } = await sendWhatsappTextMessage({
      graphApiVersion,
      phoneNumberId: connection.externalId,
      accessToken: connection.accessToken,
      to: normalizeWhatsappPhone(contact.phone),
      body: dto.message,
    });

    const activity = await this.activities.log({
      type: 'whatsapp',
      relatedToType: 'contact',
      relatedToId: contact.id,
      payload: { direction: 'outbound', message: dto.message, wamid },
    });

    await this.tenantDb.db
      .insertInto('whatsappMessages')
      .values({
        workspaceId: this.tenantDb.workspaceId,
        wamid,
        direction: 'outbound',
        contactId: contact.id,
        activityId: activity.id,
        status: 'sent',
      })
      .execute();

    return activity;
  }
}

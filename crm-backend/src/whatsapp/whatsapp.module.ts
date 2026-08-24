import { Module } from '@nestjs/common';
import { ActivitiesModule } from '../activities/activities.module';
import { WhatsappConnectionController } from './whatsapp-connection.controller';
import { WhatsappConnectionService } from './whatsapp-connection.service';
import { WhatsappMessagingController } from './whatsapp-messaging.controller';
import { WhatsappMessagingService } from './whatsapp-messaging.service';
import { WhatsappWebhookController } from './whatsapp-webhook.controller';
import { WhatsappWebhookService } from './whatsapp-webhook.service';

@Module({
  imports: [ActivitiesModule],
  controllers: [WhatsappConnectionController, WhatsappMessagingController, WhatsappWebhookController],
  providers: [WhatsappConnectionService, WhatsappMessagingService, WhatsappWebhookService],
})
export class WhatsappModule {}

import { Controller, Get, Headers, HttpCode, Post, Query, Req } from '@nestjs/common';
import type { Request } from 'express';
import { Public } from '../common/decorators/public.decorator';
import { WhatsappWebhookService } from './whatsapp-webhook.service';

@Controller('webhooks/whatsapp')
export class WhatsappWebhookController {
  constructor(private readonly webhook: WhatsappWebhookService) {}

  @Public()
  @Get()
  verify(@Query('hub.mode') mode?: string, @Query('hub.verify_token') token?: string, @Query('hub.challenge') challenge?: string) {
    return this.webhook.verifyChallenge(mode, token, challenge);
  }

  @Public()
  @Post()
  @HttpCode(200)
  async receive(@Req() req: Request, @Headers('x-hub-signature-256') signature?: string) {
    this.webhook.verifySignature((req as Request & { rawBody?: Buffer }).rawBody, signature);
    await this.webhook.handleEvent(req.body);
    return { received: true };
  }
}

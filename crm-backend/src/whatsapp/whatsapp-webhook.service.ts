import { ForbiddenException, Inject, Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { sql, type Kysely } from 'kysely';
import { createHmac, timingSafeEqual } from 'node:crypto';
import type { Database } from '../../db/types';
import { AiAgentService } from '../ai-agent/ai-agent.service';
import { setWhatsappWebhookLookupContext, setWorkspaceRlsContext } from '../common/tenant/set-workspace-rls';
import { KYSELY_RAW } from '../database/database.constants';
import { sendWhatsappTextMessage } from './whatsapp-graph-client';
import { normalizeWhatsappPhone } from './whatsapp-phone.util';

interface WhatsappWebhookMessage {
  from: string;
  id: string;
  timestamp: string;
  type: string;
  text?: { body: string };
}

interface WhatsappWebhookStatus {
  id: string;
  status: string;
  recipient_id: string;
}

interface WhatsappWebhookValue {
  metadata: { phone_number_id: string; display_phone_number?: string };
  contacts?: { profile?: { name?: string }; wa_id: string }[];
  messages?: WhatsappWebhookMessage[];
  statuses?: WhatsappWebhookStatus[];
}

interface WhatsappWebhookPayload {
  object?: string;
  entry?: { id: string; changes: { field: string; value: WhatsappWebhookValue }[] }[];
}

const VALID_STATUS_UPDATES = ['sent', 'delivered', 'read', 'failed'];

/**
 * Recebe eventos da Meta Cloud API (mensagens recebidas + status de entrega/leitura das
 * que a gente manda). Roda fora do TenantInterceptor de propósito — a Meta manda um único
 * webhook pra todos os workspaces, então o tenant só é descoberto DEPOIS de ler o
 * phone_number_id de dentro do payload (ver resolveConnection). Por isso usa o client
 * Kysely raw + abre suas próprias transações, em vez de TenantDb.
 */
@Injectable()
export class WhatsappWebhookService {
  private readonly logger = new Logger(WhatsappWebhookService.name);

  constructor(
    @Inject(KYSELY_RAW) private readonly db: Kysely<Database>,
    private readonly config: ConfigService,
    private readonly aiAgent: AiAgentService,
  ) {}

  /** GET /webhooks/whatsapp — handshake de verificação exigido pela Meta ao configurar o webhook. */
  verifyChallenge(mode: string | undefined, token: string | undefined, challenge: string | undefined): string {
    const expectedToken = this.config.get<string>('WHATSAPP_WEBHOOK_VERIFY_TOKEN');
    if (!expectedToken) throw new InternalServerErrorException('WHATSAPP_WEBHOOK_VERIFY_TOKEN não configurado.');
    if (mode !== 'subscribe' || token !== expectedToken || !challenge) {
      throw new ForbiddenException('Verificação de webhook do WhatsApp falhou.');
    }
    return challenge;
  }

  /** Valida X-Hub-Signature-256 (HMAC-SHA256 do corpo bruto com o app secret) antes de processar o evento. */
  verifySignature(rawBody: Buffer | undefined, signatureHeader: string | undefined): void {
    const appSecret = this.config.get<string>('WHATSAPP_APP_SECRET');
    if (!appSecret) throw new InternalServerErrorException('WHATSAPP_APP_SECRET não configurado.');
    if (!rawBody || !signatureHeader?.startsWith('sha256=')) {
      throw new ForbiddenException('Assinatura do webhook do WhatsApp ausente ou inválida.');
    }

    const expected = createHmac('sha256', appSecret).update(rawBody).digest('hex');
    const provided = signatureHeader.slice('sha256='.length);
    const expectedBuf = Buffer.from(expected, 'hex');
    const providedBuf = Buffer.from(provided, 'hex');

    if (expectedBuf.length !== providedBuf.length || !timingSafeEqual(expectedBuf, providedBuf)) {
      throw new ForbiddenException('Assinatura do webhook do WhatsApp inválida.');
    }
  }

  async handleEvent(payload: WhatsappWebhookPayload): Promise<void> {
    for (const entry of payload.entry ?? []) {
      for (const change of entry.changes ?? []) {
        if (change.field !== 'messages') continue;
        await this.handleValue(change.value);
      }
    }
  }

  private async handleValue(value: WhatsappWebhookValue): Promise<void> {
    const phoneNumberId = value.metadata?.phone_number_id;
    if (!phoneNumberId) return;

    const connection = await this.resolveConnection(phoneNumberId);
    if (!connection) {
      this.logger.warn(`Evento de webhook do WhatsApp para phone_number_id desconhecido: ${phoneNumberId}`);
      return;
    }

    for (const message of value.messages ?? []) {
      await this.handleInboundMessage(connection.workspaceId, message, value);
    }
    for (const status of value.statuses ?? []) {
      await this.handleStatusUpdate(connection.workspaceId, status);
    }
  }

  /** Único ponto do módulo que consulta integration_connections sem tenant já resolvido (ver migration 011). */
  private async resolveConnection(phoneNumberId: string) {
    return this.db.transaction().execute(async (trx) => {
      await setWhatsappWebhookLookupContext(trx);
      return trx
        .selectFrom('integrationConnections')
        .select(['workspaceId'])
        .where('provider', '=', 'whatsapp')
        .where('externalId', '=', phoneNumberId)
        .where('status', '=', 'active')
        .executeTakeFirst();
    });
  }

  private async handleInboundMessage(workspaceId: string, message: WhatsappWebhookMessage, value: WhatsappWebhookValue): Promise<void> {
    await this.db.transaction().execute(async (trx) => {
      await setWorkspaceRlsContext(trx, workspaceId);

      const already = await trx
        .selectFrom('whatsappMessages')
        .select('id')
        .where('workspaceId', '=', workspaceId)
        .where('wamid', '=', message.id)
        .executeTakeFirst();
      if (already) return; // retry do Meta pro mesmo evento — idempotente

      const phone = normalizeWhatsappPhone(message.from);
      const profileName = value.contacts?.find((c) => c.wa_id === message.from)?.profile?.name;

      // contacts.phone é digitado livremente no resto do CRM ("+55 11 98888-7777", "(11)
      // 98888-7777"...) — normaliza os dois lados pra dígitos antes de comparar, senão um
      // contato existente nunca bate com o "from" (só dígitos) que a Meta manda.
      let contact = await trx
        .selectFrom('contacts')
        .selectAll()
        .where('workspaceId', '=', workspaceId)
        .where(sql<string>`regexp_replace(phone, '[^0-9]', '', 'g')`, '=', phone)
        .where('deletedAt', 'is', null)
        .executeTakeFirst();

      if (!contact) {
        contact = await trx
          .insertInto('contacts')
          .values({
            workspaceId,
            firstName: profileName ?? phone,
            lastName: null,
            email: null,
            phone,
            title: null,
            companyId: null,
            sourceCampaignId: null,
            ownerId: null,
            customFields: { source: 'whatsapp_webhook' },
          })
          .returningAll()
          .executeTakeFirstOrThrow();
      }

      const messageBody = message.text?.body ?? `[${message.type}]`;

      const activity = await trx
        .insertInto('activities')
        .values({
          workspaceId,
          type: 'whatsapp',
          relatedToType: 'contact',
          relatedToId: contact.id,
          actorId: null,
          payload: { direction: 'inbound', message: messageBody, wamid: message.id, from: message.from },
        })
        .returningAll()
        .executeTakeFirstOrThrow();

      await trx
        .insertInto('whatsappMessages')
        .values({
          workspaceId,
          wamid: message.id,
          direction: 'inbound',
          contactId: contact.id,
          activityId: activity.id,
          status: 'received',
        })
        .execute();

      await this.maybeSendAutonomousReply(trx, workspaceId, contact.id);
    });
  }

  /**
   * Se a Central de I.A. está ligada (enabled + agentEnabled + api_key) pro workspace,
   * gera e envia uma resposta autônoma — vira uma activity/whatsapp_message outbound com
   * actorId null (é assim que MessagingMetricsService distingue humano de automação).
   * Falha silenciosamente (loga e segue) — um erro de IA nunca deve derrubar o webhook.
   */
  private async maybeSendAutonomousReply(trx: Kysely<Database>, workspaceId: string, contactId: string): Promise<void> {
    try {
      const replyText = await this.aiAgent.generateReply(trx, workspaceId, contactId);
      if (!replyText) return;

      const connection = await trx
        .selectFrom('integrationConnections')
        .selectAll()
        .where('workspaceId', '=', workspaceId)
        .where('provider', '=', 'whatsapp')
        .where('status', '=', 'active')
        .executeTakeFirst();
      if (!connection) return;

      const contact = await trx.selectFrom('contacts').select('phone').where('id', '=', contactId).executeTakeFirst();
      if (!contact?.phone) return;

      const graphApiVersion = this.config.get<string>('WHATSAPP_GRAPH_API_VERSION') ?? 'v20.0';
      const { wamid } = await sendWhatsappTextMessage({
        graphApiVersion,
        phoneNumberId: connection.externalId,
        accessToken: connection.accessToken,
        to: normalizeWhatsappPhone(contact.phone),
        body: replyText,
      });

      const activity = await trx
        .insertInto('activities')
        .values({
          workspaceId,
          type: 'whatsapp',
          relatedToType: 'contact',
          relatedToId: contactId,
          actorId: null,
          payload: { direction: 'outbound', message: replyText, wamid, automated: true },
        })
        .returningAll()
        .executeTakeFirstOrThrow();

      await trx
        .insertInto('whatsappMessages')
        .values({ workspaceId, wamid, direction: 'outbound', contactId, activityId: activity.id, status: 'sent' })
        .execute();
    } catch (err) {
      this.logger.warn(`Falha ao enviar resposta autônoma de IA (workspace ${workspaceId}): ${(err as Error).message}`);
    }
  }

  private async handleStatusUpdate(workspaceId: string, status: WhatsappWebhookStatus): Promise<void> {
    if (!VALID_STATUS_UPDATES.includes(status.status)) return;

    await this.db.transaction().execute(async (trx) => {
      await setWorkspaceRlsContext(trx, workspaceId);
      await trx
        .updateTable('whatsappMessages')
        .set({ status: status.status })
        .where('workspaceId', '=', workspaceId)
        .where('wamid', '=', status.id)
        .execute();
    });
  }
}

import { Injectable, Logger } from '@nestjs/common';
import type { Kysely, Transaction } from 'kysely';
import type { Database } from '../../db/types';
import { generateGeminiReply, type GeminiMessage } from './gemini-client';

const HISTORY_LIMIT = 10;

/**
 * Gera a resposta autônoma do agente de IA pra uma mensagem de WhatsApp recebida.
 * Não depende de TenantDb de propósito — quem chama (WhatsappWebhookService) já está
 * dentro de uma transação com o RLS do workspace certo setado (webhook não tem
 * AsyncLocalStorage de tenant, ver whatsapp-webhook.service.ts).
 */
@Injectable()
export class AiAgentService {
  private readonly logger = new Logger(AiAgentService.name);

  /** Retorna null quando a IA está desligada/sem chave — quem chama decide o fallback (ex.: deixar pro humano). */
  async generateReply(db: Kysely<Database> | Transaction<Database>, workspaceId: string, contactId: string): Promise<string | null> {
    const settings = await db.selectFrom('aiSettings').selectAll().where('workspaceId', '=', workspaceId).executeTakeFirst();
    if (!settings?.enabled || !settings.agentEnabled || !settings.apiKey) return null;

    const contact = await db.selectFrom('contacts').selectAll().where('id', '=', contactId).where('workspaceId', '=', workspaceId).executeTakeFirst();
    if (!contact) return null;

    const company = contact.companyId
      ? await db.selectFrom('companies').select(['name', 'industry']).where('id', '=', contact.companyId).executeTakeFirst()
      : null;

    const recentMessages = await db
      .selectFrom('whatsappMessages')
      .innerJoin('activities', 'activities.id', 'whatsappMessages.activityId')
      .select(['whatsappMessages.direction', 'activities.payload'])
      .where('whatsappMessages.workspaceId', '=', workspaceId)
      .where('whatsappMessages.contactId', '=', contactId)
      .orderBy('whatsappMessages.createdAt', 'desc')
      .limit(HISTORY_LIMIT)
      .execute();

    const history: GeminiMessage[] = recentMessages
      .reverse()
      .map((m) => {
        const payload = m.payload as Record<string, unknown>;
        const text = typeof payload.message === 'string' ? payload.message : '';
        return { role: m.direction === 'inbound' ? ('user' as const) : ('model' as const), text };
      })
      .filter((m) => m.text.trim().length > 0);

    if (history.length === 0 || history[history.length - 1].role !== 'user') {
      // generateContent exige terminar em "user" — sem isso não tem o que responder agora.
      return null;
    }

    const systemInstruction = [
      'Você é um assistente de atendimento via WhatsApp de uma empresa que usa um CRM B2B.',
      `Cliente: ${contact.firstName} ${contact.lastName ?? ''}`.trim(),
      company?.name ? `Empresa do cliente: ${company.name}${company.industry ? ` (${company.industry})` : ''}.` : '',
      'Responda em português, de forma breve, profissional e útil.',
      'Se a pergunta exigir acesso a dados que você não tem, ou o cliente parecer insatisfeito/pedir atendente, diga que vai chamar um atendente humano — não invente informação.',
    ]
      .filter(Boolean)
      .join('\n');

    try {
      return await generateGeminiReply({
        apiKey: settings.apiKey,
        model: settings.model,
        systemInstruction,
        history,
        searchGrounding: settings.searchGrounding,
      });
    } catch (err) {
      this.logger.warn(`Falha ao gerar resposta do agente de IA (workspace ${workspaceId}): ${(err as Error).message}`);
      return null;
    }
  }
}

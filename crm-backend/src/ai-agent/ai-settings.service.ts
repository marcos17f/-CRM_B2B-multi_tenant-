import { Injectable } from '@nestjs/common';
import { TenantDb } from '../database/tenant-db.service';
import type { UpdateAiSettingsDto } from './dto/update-ai-settings.dto';

const PUBLIC_COLUMNS = [
  'enabled',
  'agentEnabled',
  'model',
  'thinkingMode',
  'searchGrounding',
  'lgpdConsentAt',
  'telegramChatId',
  'updatedAt',
] as const;

@Injectable()
export class AiSettingsService {
  constructor(private readonly tenantDb: TenantDb) {}

  /** Nunca devolve api_key/telegram_bot_token — só se a chave está configurada (hasApiKey). */
  async get() {
    const row = await this.tenantDb.db
      .selectFrom('aiSettings')
      .select(PUBLIC_COLUMNS)
      .where('workspaceId', '=', this.tenantDb.workspaceId)
      .executeTakeFirst();

    const hasApiKey = await this.tenantDb.db
      .selectFrom('aiSettings')
      .select('apiKey')
      .where('workspaceId', '=', this.tenantDb.workspaceId)
      .executeTakeFirst();

    return {
      enabled: row?.enabled ?? false,
      agentEnabled: row?.agentEnabled ?? false,
      model: row?.model ?? 'gemini-3.6-flash',
      thinkingMode: row?.thinkingMode ?? false,
      searchGrounding: row?.searchGrounding ?? false,
      lgpdConsentAt: row?.lgpdConsentAt ?? null,
      hasApiKey: !!hasApiKey?.apiKey,
      hasTelegram: !!row?.telegramChatId,
    };
  }

  /** Uso interno (AiAgentService/webhook) — inclui a api_key de verdade. */
  async getInternal(workspaceId: string) {
    return this.tenantDb.db.selectFrom('aiSettings').selectAll().where('workspaceId', '=', workspaceId).executeTakeFirst();
  }

  async update(dto: UpdateAiSettingsDto) {
    const workspaceId = this.tenantDb.workspaceId;
    const existing = await this.tenantDb.db.selectFrom('aiSettings').select('workspaceId').where('workspaceId', '=', workspaceId).executeTakeFirst();

    const values: Record<string, unknown> = {};
    if (dto.enabled !== undefined) values.enabled = dto.enabled;
    if (dto.agentEnabled !== undefined) values.agentEnabled = dto.agentEnabled;
    if (dto.apiKey !== undefined) values.apiKey = dto.apiKey;
    if (dto.model !== undefined) values.model = dto.model;
    if (dto.thinkingMode !== undefined) values.thinkingMode = dto.thinkingMode;
    if (dto.searchGrounding !== undefined) values.searchGrounding = dto.searchGrounding;
    if (dto.lgpdConsent) values.lgpdConsentAt = new Date();
    if (dto.telegramBotToken !== undefined) values.telegramBotToken = dto.telegramBotToken;
    if (dto.telegramChatId !== undefined) values.telegramChatId = dto.telegramChatId;

    if (existing) {
      await this.tenantDb.db.updateTable('aiSettings').set(values).where('workspaceId', '=', workspaceId).execute();
    } else {
      await this.tenantDb.db
        .insertInto('aiSettings')
        .values({ workspaceId, ...values })
        .execute();
    }

    return this.get();
  }
}

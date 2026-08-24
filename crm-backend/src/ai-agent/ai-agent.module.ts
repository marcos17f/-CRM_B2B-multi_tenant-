import { Module } from '@nestjs/common';
import { AiAgentService } from './ai-agent.service';
import { AiSettingsController } from './ai-settings.controller';
import { AiSettingsService } from './ai-settings.service';

@Module({
  controllers: [AiSettingsController],
  providers: [AiSettingsService, AiAgentService],
  exports: [AiAgentService],
})
export class AiAgentModule {}

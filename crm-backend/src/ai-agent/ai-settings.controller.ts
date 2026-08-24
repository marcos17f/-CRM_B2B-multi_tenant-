import { Body, Controller, Get, Patch } from '@nestjs/common';
import { RequirePermission } from '../common/decorators/require-permission.decorator';
import { PERMISSIONS } from '../common/permissions/catalog';
import { AiSettingsService } from './ai-settings.service';
import { UpdateAiSettingsDto } from './dto/update-ai-settings.dto';

@Controller('ai-settings')
export class AiSettingsController {
  constructor(private readonly aiSettings: AiSettingsService) {}

  @Get()
  @RequirePermission(PERMISSIONS.AI_MANAGE)
  get() {
    return this.aiSettings.get();
  }

  @Patch()
  @RequirePermission(PERMISSIONS.AI_MANAGE)
  update(@Body() dto: UpdateAiSettingsDto) {
    return this.aiSettings.update(dto);
  }
}

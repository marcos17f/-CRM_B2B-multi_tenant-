import { Controller, Get, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { RequirePermission } from '../common/decorators/require-permission.decorator';
import { PERMISSIONS } from '../common/permissions/catalog';
import { AiService } from './ai.service';

@Controller('ai/suggestions')
export class AiController {
  constructor(private readonly ai: AiService) {}

  @Get()
  list() {
    return this.ai.list();
  }

  // Dispensar não muda nada além da própria sugestão — qualquer pessoa autenticada do
  // workspace pode fazer, igual marcar uma notificação como lida.
  @Post(':id/dismiss')
  dismiss(@Param('id', ParseUUIDPipe) id: string) {
    return this.ai.dismiss(id);
  }

  // Aprovar aplica a ação proposta (hoje: mudar riskLevel de uma oportunidade) — exige a
  // mesma permissão que editar a oportunidade exigiria diretamente.
  @Post(':id/approve')
  @RequirePermission(PERMISSIONS.OPPORTUNITIES_WRITE)
  approve(@Param('id', ParseUUIDPipe) id: string) {
    return this.ai.approve(id);
  }
}

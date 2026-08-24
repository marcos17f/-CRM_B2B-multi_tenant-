import { Body, Controller, Get, Param, Patch } from '@nestjs/common';
import { IsBoolean } from 'class-validator';
import { RequirePermission } from '../common/decorators/require-permission.decorator';
import { PERMISSIONS } from '../common/permissions/catalog';
import { WorkflowsService } from './workflows.service';

class SetWorkflowEnabledDto {
  @IsBoolean()
  enabled!: boolean;
}

@Controller('workflows')
export class WorkflowsController {
  constructor(private readonly workflows: WorkflowsService) {}

  @Get()
  list() {
    return this.workflows.list();
  }

  // Ligar/desligar uma automação é configuração de workspace — mesma permissão de
  // GET/gestão do workspace, que hoje só o owner tem (ver SYSTEM_ROLES em catalog.ts).
  @Patch(':key')
  @RequirePermission(PERMISSIONS.WORKSPACE_MANAGE)
  setEnabled(@Param('key') key: string, @Body() dto: SetWorkflowEnabledDto) {
    return this.workflows.setEnabled(key, dto.enabled);
  }
}

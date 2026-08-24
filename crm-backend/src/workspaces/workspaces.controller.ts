import { Body, Controller, Get, Patch } from '@nestjs/common';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RequirePermission } from '../common/decorators/require-permission.decorator';
import { PERMISSIONS } from '../common/permissions/catalog';
import type { AuthenticatedUser } from '../auth/types';
import { ChangePlanDto } from '../plans/dto/change-plan.dto';
import { PlansService } from '../plans/plans.service';
import { UpdateBrandingDto } from './dto/update-branding.dto';
import { WorkspacesService } from './workspaces.service';

@Controller('workspaces')
export class WorkspacesController {
  constructor(
    private readonly workspaces: WorkspacesService,
    private readonly plans: PlansService,
  ) {}

  @Get('me')
  async me(@CurrentUser() user: AuthenticatedUser) {
    const workspace = await this.workspaces.current();
    return { workspace, roleId: user.roleId, permissions: user.permissions };
  }

  /** Branding white-label (logo/cor/domínio pretendido) — não roteia DNS de verdade, só armazena. */
  @Patch('me/branding')
  @RequirePermission(PERMISSIONS.WORKSPACE_MANAGE)
  updateBranding(@Body() dto: UpdateBrandingDto) {
    return this.workspaces.updateBranding(dto);
  }

  @Get('me/plan')
  @RequirePermission(PERMISSIONS.WORKSPACE_MANAGE)
  currentPlan() {
    return this.plans.currentPlanWithUsage();
  }

  /** Troca de plano self-service — sem cobrança real integrada (ver migration 013). */
  @Patch('me/plan')
  @RequirePermission(PERMISSIONS.WORKSPACE_MANAGE)
  changePlan(@Body() dto: ChangePlanDto) {
    return this.plans.changePlan(dto.planId);
  }
}

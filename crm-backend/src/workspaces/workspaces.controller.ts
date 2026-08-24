import { Controller, Get } from '@nestjs/common';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/types';
import { WorkspacesService } from './workspaces.service';

@Controller('workspaces')
export class WorkspacesController {
  constructor(private readonly workspaces: WorkspacesService) {}

  @Get('me')
  async me(@CurrentUser() user: AuthenticatedUser) {
    const workspace = await this.workspaces.current();
    return { workspace, roleId: user.roleId, permissions: user.permissions };
  }
}

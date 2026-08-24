import { Body, Controller, Get, Post } from '@nestjs/common';
import { PERMISSIONS } from '../common/permissions/catalog';
import { RequirePermission } from '../common/decorators/require-permission.decorator';
import { InviteMemberDto } from './dto/invite-member.dto';
import { MembersService } from './members.service';

@Controller('members')
export class MembersController {
  constructor(private readonly members: MembersService) {}

  @Get()
  list() {
    return this.members.list();
  }

  @Post('invite')
  @RequirePermission(PERMISSIONS.MEMBERS_MANAGE)
  invite(@Body() dto: InviteMemberDto) {
    return this.members.invite(dto);
  }
}

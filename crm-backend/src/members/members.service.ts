import { ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import type { Kysely } from 'kysely';
import type { Database } from '../../db/types';
import { KYSELY_RAW } from '../database/database.constants';
import { TenantDb } from '../database/tenant-db.service';
import type { InviteMemberDto } from './dto/invite-member.dto';

@Injectable()
export class MembersService {
  constructor(
    private readonly tenantDb: TenantDb,
    @Inject(KYSELY_RAW) private readonly rawDb: Kysely<Database>,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  list() {
    return this.tenantDb.db
      .selectFrom('workspaceMembers as wm')
      .innerJoin('users as u', 'u.id', 'wm.userId')
      .innerJoin('roles as r', 'r.id', 'wm.roleId')
      .select(['wm.id', 'wm.status', 'wm.joinedAt', 'u.name', 'u.email', 'r.name as roleName'])
      .where('wm.workspaceId', '=', this.tenantDb.workspaceId)
      .orderBy('u.name')
      .execute();
  }

  async invite(dto: InviteMemberDto) {
    const role = await this.tenantDb.db
      .selectFrom('roles')
      .select('id')
      .where('name', '=', dto.roleName)
      .where('workspaceId', 'is', null) // por ora só roles de sistema; roles custom por workspace são da seção 3
      .executeTakeFirst();
    if (!role) throw new NotFoundException(`Role "${dto.roleName}" não encontrada.`);

    // O usuário pode já existir globalmente (participa de outro workspace) — nesse caso
    // só cria o membership; senão cria o registro de usuário sem senha (definida no accept-invite).
    let user = await this.rawDb.selectFrom('users').select(['id']).where('email', '=', dto.email.toLowerCase()).executeTakeFirst();
    if (!user) {
      user = await this.rawDb
        .insertInto('users')
        .values({ email: dto.email.toLowerCase(), name: dto.name ?? dto.email, status: 'active', passwordHash: null })
        .returning('id')
        .executeTakeFirstOrThrow();
    }

    const existingMembership = await this.tenantDb.db
      .selectFrom('workspaceMembers')
      .select('id')
      .where('workspaceId', '=', this.tenantDb.workspaceId)
      .where('userId', '=', user.id)
      .executeTakeFirst();
    if (existingMembership) throw new ConflictException('Essa pessoa já é membro (ou tem convite pendente) deste workspace.');

    const member = await this.tenantDb.db
      .insertInto('workspaceMembers')
      .values({
        workspaceId: this.tenantDb.workspaceId,
        userId: user.id,
        roleId: role.id,
        status: 'invited',
        invitedBy: this.tenantDb.workspaceMemberId,
      })
      .returningAll()
      .executeTakeFirstOrThrow();

    const inviteToken = await this.jwt.signAsync(
      { sub: member.id, type: 'invite' },
      { secret: this.config.getOrThrow('JWT_SECRET'), expiresIn: '7d' },
    );

    // Envio de e-mail transacional fica fora de escopo aqui (plugar SES/Postmark/Resend
    // é um bom item pra seção de Workflows). Por ora devolvemos o token/link direto.
    return {
      memberId: member.id,
      inviteToken,
      inviteUrl: `https://app.exemplo.com/accept-invite?token=${inviteToken}`,
    };
  }
}

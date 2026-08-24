import { ConflictException, Inject, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import type { Kysely, Transaction } from 'kysely';
import type { Database } from '../../db/types';
import { KYSELY_RAW } from '../database/database.constants';
import { setWorkspaceRlsContext } from '../common/tenant/set-workspace-rls';
import { hashPassword, verifyPassword } from '../common/security/password';
import { generateOpaqueToken, hashToken } from '../common/security/token';
import { parseDurationMs } from '../common/security/duration';
import type { AcceptInviteDto } from './dto/accept-invite.dto';
import type { LoginDto } from './dto/login.dto';
import type { RefreshDto } from './dto/refresh.dto';
import type { RegisterDto } from './dto/register.dto';
import type { SelectWorkspaceDto } from './dto/select-workspace.dto';

const DEFAULT_STAGES = [
  { name: 'Qualificação', orderIndex: 0, probability: '0.100', stageType: 'open' as const },
  { name: 'Diagnóstico', orderIndex: 1, probability: '0.300', stageType: 'open' as const },
  { name: 'Proposta', orderIndex: 2, probability: '0.600', stageType: 'open' as const },
  { name: 'Negociação', orderIndex: 3, probability: '0.800', stageType: 'open' as const },
  { name: 'Ganho', orderIndex: 4, probability: '1.000', stageType: 'won' as const },
  { name: 'Perdido', orderIndex: 5, probability: '0.000', stageType: 'lost' as const },
];

@Injectable()
export class AuthService {
  constructor(
    @Inject(KYSELY_RAW) private readonly db: Kysely<Database>,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  /** Signup: cria usuário + workspace novo + o usuário vira 'owner' + pipeline default. */
  async register(dto: RegisterDto) {
    return this.db.transaction().execute(async (trx) => {
      const existingUser = await trx
        .selectFrom('users')
        .select('id')
        .where('email', '=', dto.email.toLowerCase())
        .executeTakeFirst();
      if (existingUser) throw new ConflictException('E-mail já cadastrado.');

      const existingSlug = await trx
        .selectFrom('workspaces')
        .select('id')
        .where('slug', '=', dto.workspaceSlug)
        .executeTakeFirst();
      if (existingSlug) throw new ConflictException('Esse slug de workspace já está em uso.');

      const ownerRole = await trx
        .selectFrom('roles')
        .select(['id', 'permissions'])
        .where('name', '=', 'owner')
        .where('workspaceId', 'is', null)
        .executeTakeFirstOrThrow();

      const passwordHash = await hashPassword(dto.password);

      const user = await trx
        .insertInto('users')
        .values({ email: dto.email.toLowerCase(), passwordHash, name: dto.name, status: 'active' })
        .returningAll()
        .executeTakeFirstOrThrow();

      const workspace = await trx
        .insertInto('workspaces')
        .values({ name: dto.workspaceName, slug: dto.workspaceSlug, status: 'active' })
        .returningAll()
        .executeTakeFirstOrThrow();

      // A partir daqui escrevemos em tabelas com RLS forçado — ativa o contexto do
      // workspace recém-criado nesta mesma transação antes de continuar.
      await setWorkspaceRlsContext(trx, workspace.id);

      const member = await trx
        .insertInto('workspaceMembers')
        .values({ workspaceId: workspace.id, userId: user.id, roleId: ownerRole.id, status: 'active', joinedAt: new Date() })
        .returningAll()
        .executeTakeFirstOrThrow();

      const pipeline = await trx
        .insertInto('pipelines')
        .values({ workspaceId: workspace.id, name: 'Vendas', isDefault: true })
        .returningAll()
        .executeTakeFirstOrThrow();

      await trx
        .insertInto('pipelineStages')
        .values(DEFAULT_STAGES.map((stage) => ({ pipelineId: pipeline.id, ...stage })))
        .execute();

      const tokens = await this.issueTokens(
        trx,
        member.id,
        workspace.id,
        user.id,
        ownerRole.id,
        ownerRole.permissions as string[],
      );

      return { ...tokens, workspace: { id: workspace.id, name: workspace.name, slug: workspace.slug } };
    });
  }

  /** Login por e-mail/senha. Se a pessoa pertence a >1 workspace, devolve um pré-token pra escolher. */
  async login(dto: LoginDto) {
    const user = await this.db
      .selectFrom('users')
      .selectAll()
      .where('email', '=', dto.email.toLowerCase())
      .executeTakeFirst();

    if (!user || !(await verifyPassword(dto.password, user.passwordHash))) {
      throw new UnauthorizedException('E-mail ou senha inválidos.');
    }
    if (user.status !== 'active') {
      throw new UnauthorizedException('Conta desativada.');
    }

    const memberships = await this.db
      .selectFrom('workspaceMembers as wm')
      .innerJoin('workspaces as w', 'w.id', 'wm.workspaceId')
      .innerJoin('roles as r', 'r.id', 'wm.roleId')
      .select([
        'wm.id as memberId',
        'wm.roleId as roleId',
        'w.id as workspaceId',
        'w.name as workspaceName',
        'w.slug as workspaceSlug',
        'r.permissions as permissions',
      ])
      .where('wm.userId', '=', user.id)
      .where('wm.status', '=', 'active')
      .execute();

    if (memberships.length === 0) {
      throw new UnauthorizedException('Sem workspace ativo — verifique se algum convite pendente precisa ser aceito.');
    }

    if (memberships.length === 1) {
      const m = memberships[0];
      return this.db.transaction().execute(async (trx) => {
        await setWorkspaceRlsContext(trx, m.workspaceId);
        const tokens = await this.issueTokens(trx, m.memberId, m.workspaceId, user.id, m.roleId, m.permissions as string[]);
        return { ...tokens, workspace: { id: m.workspaceId, name: m.workspaceName, slug: m.workspaceSlug } };
      });
    }

    const preAuthToken = await this.jwt.signAsync({ sub: user.id, type: 'pre_auth' }, { expiresIn: '10m' });
    return {
      requiresWorkspaceSelection: true,
      preAuthToken,
      workspaces: memberships.map((m) => ({ id: m.workspaceId, name: m.workspaceName, slug: m.workspaceSlug })),
    };
  }

  /** Segundo passo do login quando a pessoa pertence a mais de um workspace. */
  async selectWorkspace(dto: SelectWorkspaceDto) {
    const payload = await this.verifyScopedToken(dto.preAuthToken, 'pre_auth');

    const membership = await this.db
      .selectFrom('workspaceMembers as wm')
      .innerJoin('roles as r', 'r.id', 'wm.roleId')
      .select(['wm.id as memberId', 'wm.roleId as roleId', 'r.permissions as permissions'])
      .where('wm.userId', '=', payload.sub)
      .where('wm.workspaceId', '=', dto.workspaceId)
      .where('wm.status', '=', 'active')
      .executeTakeFirst();

    if (!membership) throw new UnauthorizedException('Você não pertence a esse workspace (ou o convite ainda não foi aceito).');

    return this.db.transaction().execute(async (trx) => {
      await setWorkspaceRlsContext(trx, dto.workspaceId);
      return this.issueTokens(trx, membership.memberId, dto.workspaceId, payload.sub, membership.roleId, membership.permissions as string[]);
    });
  }

  /** Troca um refresh token válido (e não revogado) por um novo par de tokens. Rotação: o antigo é revogado no processo. */
  async refresh(dto: RefreshDto) {
    const tokenHash = hashToken(dto.refreshToken);
    const stored = await this.db.selectFrom('refreshTokens').selectAll().where('tokenHash', '=', tokenHash).executeTakeFirst();

    if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
      throw new UnauthorizedException('Refresh token inválido ou expirado.');
    }

    const member = await this.db
      .selectFrom('workspaceMembers as wm')
      .innerJoin('roles as r', 'r.id', 'wm.roleId')
      .select(['wm.id as memberId', 'wm.workspaceId as workspaceId', 'wm.userId as userId', 'wm.roleId as roleId', 'wm.status as status', 'r.permissions as permissions'])
      .where('wm.id', '=', stored.workspaceMemberId)
      .executeTakeFirstOrThrow();

    if (member.status !== 'active') throw new UnauthorizedException('Membership inativo.');

    return this.db.transaction().execute(async (trx) => {
      await setWorkspaceRlsContext(trx, member.workspaceId);
      await trx.updateTable('refreshTokens').set({ revokedAt: new Date() }).where('id', '=', stored.id).execute();
      return this.issueTokens(trx, member.memberId, member.workspaceId, member.userId, member.roleId, member.permissions as string[]);
    });
  }

  /** Aceita um convite: define senha (primeira vez) e ativa o membership. */
  async acceptInvite(dto: AcceptInviteDto) {
    const payload = await this.verifyScopedToken(dto.inviteToken, 'invite');

    const member = await this.db.selectFrom('workspaceMembers').selectAll().where('id', '=', payload.sub).executeTakeFirst();
    if (!member) throw new NotFoundException('Convite não encontrado.');
    if (member.status !== 'invited') throw new UnauthorizedException('Convite já utilizado ou revogado.');

    const passwordHash = await hashPassword(dto.password);

    return this.db.transaction().execute(async (trx) => {
      await setWorkspaceRlsContext(trx, member.workspaceId);

      const userUpdate: { passwordHash: string; name?: string } = { passwordHash };
      if (dto.name) userUpdate.name = dto.name;
      await trx.updateTable('users').set(userUpdate).where('id', '=', member.userId).execute();

      await trx.updateTable('workspaceMembers').set({ status: 'active', joinedAt: new Date() }).where('id', '=', member.id).execute();

      const role = await trx.selectFrom('roles').select('permissions').where('id', '=', member.roleId).executeTakeFirstOrThrow();
      return this.issueTokens(trx, member.id, member.workspaceId, member.userId, member.roleId, role.permissions as string[]);
    });
  }

  private async verifyScopedToken(token: string, expectedType: 'pre_auth' | 'invite'): Promise<{ sub: string; type: string }> {
    try {
      const payload = await this.jwt.verifyAsync<{ sub: string; type: string }>(token);
      if (payload.type !== expectedType) throw new Error('tipo de token inesperado');
      return payload;
    } catch {
      throw new UnauthorizedException('Token inválido ou expirado.');
    }
  }

  private async issueTokens(
    trx: Transaction<Database>,
    workspaceMemberId: string,
    workspaceId: string,
    userId: string,
    roleId: string,
    permissions: string[],
  ) {
    const accessToken = await this.jwt.signAsync(
      { sub: userId, workspaceId, workspaceMemberId, roleId, permissions },
      { expiresIn: this.config.get<string>('JWT_ACCESS_TOKEN_TTL') ?? '15m' },
    );

    const refreshTtl = this.config.get<string>('JWT_REFRESH_TOKEN_TTL') ?? '30d';
    const refreshToken = generateOpaqueToken();
    const expiresAt = new Date(Date.now() + parseDurationMs(refreshTtl));

    await trx.insertInto('refreshTokens').values({ workspaceMemberId, tokenHash: hashToken(refreshToken), expiresAt }).execute();

    return { accessToken, refreshToken };
  }
}

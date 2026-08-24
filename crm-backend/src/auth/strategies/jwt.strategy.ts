import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import type { AccessTokenPayload, AuthenticatedUser } from '../types';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.getOrThrow<string>('JWT_SECRET'),
    });
  }

  // O retorno daqui vira `request.user` — ver AuthenticatedUser.
  validate(payload: AccessTokenPayload): AuthenticatedUser {
    return {
      userId: payload.sub,
      workspaceId: payload.workspaceId,
      workspaceMemberId: payload.workspaceMemberId,
      roleId: payload.roleId,
      permissions: payload.permissions,
    };
  }
}

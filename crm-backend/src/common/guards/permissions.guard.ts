import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { hasPermission } from '../permissions/catalog';
import { REQUIRED_PERMISSION_KEY } from '../decorators/require-permission.decorator';
import type { AuthenticatedUser } from '../../auth/types';

/**
 * Guard global que roda depois do JwtAuthGuard. Se a rota tiver `@RequirePermission(...)`,
 * checa se `request.user.permissions` cobre a permissão exigida. Rotas sem o decorator
 * passam livre daqui (a autenticação sozinha já foi garantida pelo JwtAuthGuard) — RBAC
 * granular por endpoint é opt-in, não opt-out, para não travar rotas que ainda não foram
 * anotadas.
 */
@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<string | undefined>(REQUIRED_PERMISSION_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!required) return true;

    const request = context.switchToHttp().getRequest();
    const user = request.user as AuthenticatedUser | undefined;
    if (!user || !hasPermission(user.permissions, required)) {
      throw new ForbiddenException(`Permissão necessária: ${required}`);
    }
    return true;
  }
}

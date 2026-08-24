import { SetMetadata } from '@nestjs/common';

export const REQUIRED_PERMISSION_KEY = 'requiredPermission';

/**
 * Exige uma permissão do catálogo (ver src/common/permissions/catalog.ts) para acessar
 * a rota, ex.: `@RequirePermission('companies:write')`. Checado pelo PermissionsGuard.
 */
export const RequirePermission = (permission: string) => SetMetadata(REQUIRED_PERMISSION_KEY, permission);

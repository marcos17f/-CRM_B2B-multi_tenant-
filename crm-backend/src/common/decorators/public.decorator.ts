import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/** Marca uma rota como não exigindo autenticação (ex.: /auth/login, /auth/register). */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

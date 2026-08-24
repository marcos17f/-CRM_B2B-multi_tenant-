import { createHash, randomBytes } from 'node:crypto';

/** Token opaco de alta entropia (refresh tokens) — não é JWT, só um valor aleatório. */
export function generateOpaqueToken(): string {
  return randomBytes(32).toString('hex');
}

/**
 * SHA-256 é suficiente aqui (diferente de senha): o valor já tem entropia alta o
 * bastante para não precisar de uma KDF lenta como scrypt — só queremos não guardar o
 * token em claro no banco.
 */
export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

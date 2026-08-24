/** Converte "15m", "30d", "12h", "45s" em milissegundos. Usado para expiresAt de refresh tokens. */
export function parseDurationMs(input: string): number {
  const match = /^(\d+)(s|m|h|d)$/.exec(input.trim());
  if (!match) {
    throw new Error(`Duração inválida: "${input}" (use algo como "15m", "12h", "30d")`);
  }
  const value = Number(match[1]);
  const unit = match[2] as 's' | 'm' | 'h' | 'd';
  const factor: Record<typeof unit, number> = { s: 1_000, m: 60_000, h: 3_600_000, d: 86_400_000 };
  return value * factor[unit];
}

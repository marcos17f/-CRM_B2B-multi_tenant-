/**
 * A Cloud API da Meta manda/espera números só com dígitos (com código de país, sem "+",
 * espaços ou pontuação). Normaliza dos dois lados (envio e webhook de recebimento) pra
 * bater com o que estiver salvo em contacts.phone.
 */
export function normalizeWhatsappPhone(phone: string): string {
  return phone.replace(/[^\d]/g, '');
}

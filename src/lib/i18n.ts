/**
 * Status / enum translations for UI display.
 * Keep DTO values intact when sending to API.
 */

export const ORDER_STATUS_PT: Record<string, string> = {
  PENDING: 'Pendente',
  PAID: 'Pago',
  EXPIRED: 'Expirado',
  CANCELLED: 'Cancelado',
  REFUNDED: 'Reembolsado',
};

export const TICKET_STATUS_PT: Record<string, string> = {
  VALID: 'Válido',
  USED: 'Usado',
  TRANSFERRED: 'Transferido',
  REFUNDED: 'Reembolsado',
};

export const EVENT_STATUS_PT: Record<string, string> = {
  DRAFT: 'Rascunho',
  PUBLISHED: 'Publicado',
  CANCELLED: 'Cancelado',
  ENDED: 'Encerrado',
};

export const PAYMENT_PROVIDER_PT: Record<string, string> = {
  MANUAL_PIX: 'PIX manual',
  ABACATE_PAY: 'Abacate Pay',
};

export const PAYMENT_METHOD_PT: Record<string, string> = {
  PIX: 'PIX',
  CARD: 'Cartão',
};

export const ROLE_PT: Record<string, string> = {
  ADMIN: 'Administrador',
  PRODUCER: 'Produtor',
  BUYER: 'Comprador',
  STAFF: 'Equipe',
};

export const PIX_KEY_TYPE_PT: Record<string, string> = {
  CPF: 'CPF',
  CNPJ: 'CNPJ',
  EMAIL: 'E-mail',
  PHONE: 'Telefone',
  RANDOM: 'Chave aleatória',
};

export const CATEGORY_PT: Record<string, string> = {
  SHOW: 'Show',
  FESTIVAL: 'Festival',
  BALADA: 'Balada',
  TEATRO: 'Teatro',
  STANDUP: 'Stand-up',
  ESPORTE: 'Esporte',
  KIDS: 'Infantil',
};

export const BR_STATES = [
  'AC', 'AL', 'AM', 'AP', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
  'MG', 'MS', 'MT', 'PA', 'PB', 'PE', 'PI', 'PR', 'RJ', 'RN',
  'RO', 'RR', 'RS', 'SC', 'SE', 'SP', 'TO',
] as const;

export function tr(map: Record<string, string>, key: string | null | undefined): string {
  if (!key) return '—';
  return map[key] ?? key;
}

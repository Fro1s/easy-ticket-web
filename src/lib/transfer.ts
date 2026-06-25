import { isAxiosError } from 'axios'

export type RecipientPayload = { email: string } | { cpf: string }

// ─── CPF helpers ────────────────────────────────────────────────────────────

function isValidCpf(digits: string): boolean {
  if (digits.length !== 11) return false
  if (/^(\d)\1+$/.test(digits)) return false

  let sum = 0
  for (let i = 0; i < 9; i++) sum += parseInt(digits[i]) * (10 - i)
  const d1 = sum % 11 < 2 ? 0 : 11 - (sum % 11)
  if (d1 !== parseInt(digits[9])) return false

  sum = 0
  for (let i = 0; i < 10; i++) sum += parseInt(digits[i]) * (11 - i)
  const d2 = sum % 11 < 2 ? 0 : 11 - (sum % 11)
  return d2 === parseInt(digits[10])
}

/** Progressively formats a raw input string as CPF (000.000.000-00) while the user types. */
export function formatCpfInput(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 11)
  return digits
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/(\d{3})\.(\d{3})\.(\d{3})(\d)/, '$1.$2.$3-$4')
}

/** Formats a string of exactly 11 digits as `000.000.000-00`. */
export function formatCpfDisplay(digits: string): string {
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9, 11)}`
}

// ─── Email helper ────────────────────────────────────────────────────────────

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Returns a validation error message, or null when the value is valid.
 * Distinguishes email vs CPF by the presence of '@' or non-digit characters.
 */
export function validateRecipient(value: string): string | null {
  const trimmed = value.trim()
  if (!trimmed) return 'Informe o email ou CPF do destinatário'

  // If it contains '@' or has non-digit characters (except CPF formatting), treat as email
  if (trimmed.includes('@') || /[a-zA-Z]/.test(trimmed)) {
    return EMAIL_RE.test(trimmed) ? null : 'Email inválido'
  }

  // Otherwise, validate as CPF (digits and optional CPF formatting chars)
  const digits = trimmed.replace(/\D/g, '')
  if (digits.length < 11) return 'CPF incompleto'
  if (!isValidCpf(digits)) return 'CPF inválido'
  return null
}

/**
 * Parses the validated recipient value into a typed payload for the API.
 * Returns null if the value is invalid.
 */
export function parseRecipient(value: string): RecipientPayload | null {
  const trimmed = value.trim()
  if (!trimmed) return null

  // If it contains '@' or has non-digit characters (except CPF formatting), treat as email
  if (trimmed.includes('@') || /[a-zA-Z]/.test(trimmed)) {
    return EMAIL_RE.test(trimmed) ? { email: trimmed } : null
  }

  // Otherwise, parse as CPF
  const digits = trimmed.replace(/\D/g, '')
  if (digits.length !== 11 || !isValidCpf(digits)) return null
  return { cpf: digits }
}

/** Maps an Axios error from POST /tickets/:id/transfer to a user-facing message. */
export function mapApiError(error: unknown): string {
  if (isAxiosError(error)) {
    const status = error.response?.status
    const message: string = (error.response?.data as { message?: string })?.message ?? ''
    const lower = message.toLowerCase()
    if (status === 404) return 'Essa pessoa não tem conta no Easy Ticket.'
    if (status === 403) return 'Este ingresso não pertence à sua conta.'
    if (status === 400) {
      if (lower.includes('mesmo') || lower.includes('yourself') || lower.includes('self'))
        return 'Você não pode transferir um ingresso para si mesmo.'
      return 'Este ingresso não pode ser transferido.'
    }
  }
  return 'Erro inesperado. Tente novamente.'
}

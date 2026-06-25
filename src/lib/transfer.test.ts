import { describe, it, expect } from 'vitest'
import {
  formatCpfInput,
  formatCpfDisplay,
  validateRecipient,
  parseRecipient,
  mapApiError,
} from './transfer'
import { AxiosError } from 'axios'

describe('formatCpfInput', () => {
  it('formats partial digits progressively', () => {
    expect(formatCpfInput('123')).toBe('123')
    expect(formatCpfInput('1234')).toBe('123.4')
    expect(formatCpfInput('123456')).toBe('123.456')
    expect(formatCpfInput('1234567')).toBe('123.456.7')
    expect(formatCpfInput('12345678901')).toBe('123.456.789-01')
  })
  it('strips extra digits beyond 11', () => {
    expect(formatCpfInput('123456789012')).toBe('123.456.789-01')
  })
  it('strips non-digit chars before formatting', () => {
    expect(formatCpfInput('123.456.789-01')).toBe('123.456.789-01')
  })
})

describe('formatCpfDisplay', () => {
  it('formats 11 digits into CPF display format', () => {
    expect(formatCpfDisplay('12345678901')).toBe('123.456.789-01')
  })
})

describe('validateRecipient', () => {
  it('returns error for empty value', () => {
    expect(validateRecipient('')).toBe('Informe o email ou CPF do destinatário')
    expect(validateRecipient('   ')).toBe('Informe o email ou CPF do destinatário')
  })
  it('returns error for malformed email', () => {
    expect(validateRecipient('notanemail')).toBe('Email inválido')
    expect(validateRecipient('missing@')).toBe('Email inválido')
    expect(validateRecipient('@nodomain.com')).toBe('Email inválido')
  })
  it('returns null for valid email', () => {
    expect(validateRecipient('user@example.com')).toBeNull()
  })
  it('returns error for incomplete CPF', () => {
    expect(validateRecipient('123.456.789')).toBe('CPF incompleto')
  })
  it('returns error for CPF with invalid verifier digits', () => {
    expect(validateRecipient('111.111.111-11')).toBe('CPF inválido')
  })
  it('returns null for valid CPF', () => {
    // 529.982.247-25 is a known-valid CPF
    expect(validateRecipient('529.982.247-25')).toBeNull()
  })
})

describe('parseRecipient', () => {
  it('returns { email } for a valid email', () => {
    expect(parseRecipient('user@example.com')).toEqual({ email: 'user@example.com' })
  })
  it('returns { cpf } as 11 normalized digits for a valid CPF', () => {
    expect(parseRecipient('529.982.247-25')).toEqual({ cpf: '52998224725' })
  })
  it('returns null for invalid input', () => {
    expect(parseRecipient('')).toBeNull()
    expect(parseRecipient('notvalid')).toBeNull()
    expect(parseRecipient('111.111.111-11')).toBeNull()
  })
})

describe('mapApiError', () => {
  function makeAxiosError(status: number, message = ''): AxiosError {
    const err = new AxiosError('error')
    err.response = { status, data: { message }, headers: {}, config: err.config!, statusText: '' }
    return err
  }

  it('maps 404 to account-not-found message', () => {
    expect(mapApiError(makeAxiosError(404))).toBe('Essa pessoa não tem conta no Easy Ticket.')
  })
  it('maps 403 to ownership message', () => {
    expect(mapApiError(makeAxiosError(403))).toBe('Este ingresso não pertence à sua conta.')
  })
  it('maps 400 with self-transfer keyword to self-transfer message', () => {
    expect(mapApiError(makeAxiosError(400, 'Cannot transfer to yourself'))).toBe(
      'Você não pode transferir um ingresso para si mesmo.'
    )
    expect(mapApiError(makeAxiosError(400, 'Não pode transferir para si mesmo'))).toBe(
      'Você não pode transferir um ingresso para si mesmo.'
    )
  })
  it('maps generic 400 to invalid-status message', () => {
    expect(mapApiError(makeAxiosError(400, 'Ticket is not VALID'))).toBe(
      'Este ingresso não pode ser transferido.'
    )
  })
  it('maps 5xx and non-Axios errors to generic message', () => {
    expect(mapApiError(makeAxiosError(500))).toBe('Erro inesperado. Tente novamente.')
    expect(mapApiError(new Error('network'))).toBe('Erro inesperado. Tente novamente.')
  })
})

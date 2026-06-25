# Ticket Transfer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a transfer dialog to the ticket detail page so a VALID ticket owner can transfer their ticket to another user identified by email or CPF.

**Architecture:** A pure utility layer (`src/lib/transfer.ts`) handles all parsing, validation, and error mapping. A single new component (`TransferTicketDialog`) wraps the dialog state machine and mutation. The ticket detail page replaces the existing disabled button with the new component.

**Tech Stack:** React 19, Next.js App Router, TanStack Query v5 (`useMutation`), `@base-ui/react/dialog`, Axios (`AXIOS_INSTANCE`), sonner (toasts), Vitest (tests).

## Global Constraints

- No new dependencies — all libraries already in `package.json`
- Button variants in this codebase: `primary` (default), `accent`, `outline`, `ghost` — no `secondary`, `destructive`, etc.
- `customInstance` in `src/lib/api.ts` uses `RequestInit`-style signature — use `AXIOS_INSTANCE` (also exported from same file) for direct API calls
- Dialog primitives from `@base-ui/react/dialog` use a `render` prop (not `asChild`) for polymorphic rendering
- All text is Portuguese (pt-BR)
- TypeScript strict mode — no implicit `any`

---

## File Map

| Action | Path | Responsibility |
|--------|------|----------------|
| Create | `src/lib/transfer.ts` | Pure functions: CPF validation, input formatting, recipient parsing, API error mapping |
| Create | `src/lib/transfer.test.ts` | Vitest unit tests for all pure functions |
| Create | `src/components/transfer-ticket-dialog.tsx` | Dialog component with step state machine and mutation |
| Modify | `src/app/(app)/meus-ingressos/[id]/page.tsx` | Replace disabled transfer button with `TransferTicketDialog` |

---

## Task 1: Pure utility layer

**Files:**
- Create: `src/lib/transfer.ts`
- Create: `src/lib/transfer.test.ts`

**Interfaces:**
- Produces:
  - `RecipientPayload = { email: string } | { cpf: string }`
  - `formatCpfInput(raw: string): string` — formats a raw string as CPF while typing
  - `formatCpfDisplay(digits: string): string` — formats 11-digit string as `000.000.000-00`
  - `validateRecipient(value: string): string | null` — returns error message or null
  - `parseRecipient(value: string): RecipientPayload | null` — returns typed payload or null if invalid
  - `mapApiError(error: unknown): string` — maps Axios errors to user-facing Portuguese messages

- [ ] **Step 1: Write the failing tests**

Create `src/lib/transfer.test.ts`:

```ts
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
```

- [ ] **Step 2: Run the tests to confirm they fail**

```bash
pnpm test -- src/lib/transfer.test.ts
```

Expected: Tests fail with `Cannot find module './transfer'`.

- [ ] **Step 3: Implement `src/lib/transfer.ts`**

```ts
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
 * Distinguishes email vs CPF by the presence of '@'.
 */
export function validateRecipient(value: string): string | null {
  const trimmed = value.trim()
  if (!trimmed) return 'Informe o email ou CPF do destinatário'

  if (trimmed.includes('@')) {
    return EMAIL_RE.test(trimmed) ? null : 'Email inválido'
  }

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

  if (trimmed.includes('@')) {
    return EMAIL_RE.test(trimmed) ? { email: trimmed } : null
  }

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
```

- [ ] **Step 4: Run the tests to confirm they pass**

```bash
pnpm test -- src/lib/transfer.test.ts
```

Expected: All tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/lib/transfer.ts src/lib/transfer.test.ts
git commit -m "feat(transfer): add recipient parsing, CPF validation, and error mapping utilities"
```

---

## Task 2: TransferTicketDialog component

**Files:**
- Create: `src/components/transfer-ticket-dialog.tsx`

**Interfaces:**
- Consumes (from Task 1):
  - `RecipientPayload`, `formatCpfInput`, `formatCpfDisplay`, `validateRecipient`, `parseRecipient`, `mapApiError` from `@/lib/transfer`
- Produces:
  - `TransferTicketDialog({ ticketId, shortCode, sectorName, children })` — default export, re-exported as named export

- [ ] **Step 1: Create `src/components/transfer-ticket-dialog.tsx`**

```tsx
'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { useMutation } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { AXIOS_INSTANCE } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  type RecipientPayload,
  formatCpfInput,
  formatCpfDisplay,
  validateRecipient,
  parseRecipient,
  mapApiError,
} from '@/lib/transfer'

interface TransferTicketDialogProps {
  ticketId: string
  shortCode: string
  sectorName: string
  children: React.ReactNode
}

type Step = 'idle' | 'confirming'

interface TransferResponse {
  id: string
  shortCode: string
  status: string
  recipientEmail: string
}

async function callTransferApi(
  ticketId: string,
  payload: RecipientPayload,
): Promise<TransferResponse> {
  const { data } = await AXIOS_INSTANCE.post<TransferResponse>(
    `/api/v1/tickets/${ticketId}/transfer`,
    payload,
  )
  return data
}

export function TransferTicketDialog({
  ticketId,
  shortCode,
  sectorName,
  children,
}: TransferTicketDialogProps) {
  const router = useRouter()
  const [open, setOpen] = React.useState(false)
  const [step, setStep] = React.useState<Step>('idle')
  const [recipient, setRecipient] = React.useState('')
  const [fieldError, setFieldError] = React.useState<string | null>(null)
  const [apiError, setApiError] = React.useState<string | null>(null)

  function reset() {
    setStep('idle')
    setRecipient('')
    setFieldError(null)
    setApiError(null)
  }

  function handleOpenChange(next: boolean) {
    setOpen(next)
    if (!next) reset()
  }

  function handleRecipientChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value
    setFieldError(null)
    // Letters or '@' → email mode (no transformation). Otherwise → CPF mask.
    if (raw.includes('@') || /[a-zA-Z]/.test(raw)) {
      setRecipient(raw)
    } else {
      setRecipient(formatCpfInput(raw))
    }
  }

  function handleContinue() {
    const error = validateRecipient(recipient)
    if (error) {
      setFieldError(error)
      return
    }
    setStep('confirming')
  }

  const mutation = useMutation({
    mutationFn: () => {
      const payload = parseRecipient(recipient)!
      return callTransferApi(ticketId, payload)
    },
    onSuccess: () => {
      setOpen(false)
      toast.success('Ingresso transferido com sucesso!')
      router.push('/meus-ingressos')
    },
    onError: (error) => {
      setApiError(mapApiError(error))
    },
  })

  const parsed = step === 'confirming' ? parseRecipient(recipient) : null
  const recipientDisplay = parsed
    ? 'email' in parsed
      ? parsed.email
      : formatCpfDisplay(parsed.cpf)
    : ''

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger render={<span />}>{children}</DialogTrigger>

      <DialogContent>
        {step === 'idle' && (
          <>
            <DialogHeader>
              <DialogTitle>Transferir ingresso</DialogTitle>
              <DialogDescription>
                {shortCode} · {sectorName}
              </DialogDescription>
            </DialogHeader>

            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="transfer-recipient"
                className="text-[11px] uppercase tracking-[1px] font-mono text-ink-muted"
              >
                Email ou CPF
              </label>
              <Input
                id="transfer-recipient"
                value={recipient}
                onChange={handleRecipientChange}
                placeholder="nome@email.com ou 000.000.000-00"
                aria-invalid={fieldError ? true : undefined}
                autoComplete="off"
                autoFocus
              />
              {fieldError ? (
                <p className="text-[12px] text-destructive">{fieldError}</p>
              ) : (
                <p className="text-[12px] text-ink-muted">
                  Digite o email ou CPF cadastrado no Easy Ticket
                </p>
              )}
            </div>

            <DialogFooter>
              <DialogClose render={<Button variant="outline" size="sm" />}>
                Cancelar
              </DialogClose>
              <Button size="sm" onClick={handleContinue}>
                Continuar
              </Button>
            </DialogFooter>
          </>
        )}

        {step === 'confirming' && (
          <>
            <DialogHeader>
              <DialogTitle>Confirmar transferência</DialogTitle>
            </DialogHeader>

            <div className="flex flex-col gap-3">
              <p className="text-[14px] text-foreground">
                Você está transferindo{' '}
                <span className="font-mono font-semibold">{shortCode}</span> para:
              </p>
              <p className="font-mono text-[15px] font-semibold break-all">{recipientDisplay}</p>
              <p className="text-[12px] text-ink-muted">⚠ Essa ação não pode ser desfeita.</p>
              {apiError && <p className="text-[12px] text-destructive">{apiError}</p>}
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setStep('idle')
                  setApiError(null)
                }}
                disabled={mutation.isPending}
              >
                Voltar
              </Button>
              <Button
                size="sm"
                onClick={() => mutation.mutate()}
                disabled={mutation.isPending}
              >
                {mutation.isPending ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Transferindo…
                  </>
                ) : (
                  'Transferir →'
                )}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
```

- [ ] **Step 2: Verify TypeScript compiles without errors**

```bash
pnpm build 2>&1 | head -40
```

Expected: No TypeScript errors related to `transfer-ticket-dialog.tsx` or `transfer.ts`. (Build may fail for other pre-existing reasons — only care about the new files.)

- [ ] **Step 3: Commit**

```bash
git add src/components/transfer-ticket-dialog.tsx
git commit -m "feat(transfer): add TransferTicketDialog component"
```

---

## Task 3: Wire into ticket detail page

**Files:**
- Modify: `src/app/(app)/meus-ingressos/[id]/page.tsx:190-193`

**Interfaces:**
- Consumes (from Task 2): `TransferTicketDialog` from `@/components/transfer-ticket-dialog`

- [ ] **Step 1: Update the import block in `[id]/page.tsx`**

Add the import after the existing imports (around line 20):

```tsx
import { TransferTicketDialog } from '@/components/transfer-ticket-dialog'
```

- [ ] **Step 2: Replace the disabled transfer button (lines 191–193)**

Find this block in `TicketView` (inside the `<div className="pt-4 border-t border-border flex flex-wrap gap-2">`):

```tsx
<Button variant="ghost" size="sm" disabled>
  Transferir (em breve)
</Button>
```

Replace with:

```tsx
{isValid && (
  <TransferTicketDialog
    ticketId={ticket.id}
    shortCode={ticket.shortCode}
    sectorName={ticket.sector.name}
  >
    <Button variant="ghost" size="sm">
      Transferir
    </Button>
  </TransferTicketDialog>
)}
```

- [ ] **Step 3: Start the dev server and verify manually**

```bash
pnpm dev
```

Open `http://localhost:3000/meus-ingressos` in the browser.

**Checklist:**
- [ ] Navigate to a VALID ticket detail page — the "Transferir" button is visible and enabled
- [ ] Click "Transferir" — dialog opens with title "Transferir ingresso", subtitle shows shortCode and sector
- [ ] Submit empty field → error "Informe o email ou CPF do destinatário" appears below input
- [ ] Type `invalid@` → error "Email inválido" appears
- [ ] Type `123.456.789` (incomplete CPF) → error "CPF incompleto" appears
- [ ] Type `111.111.111-11` (invalid CPF digits) → error "CPF inválido" appears
- [ ] Type a valid email (`test@gmail.com`) → "Continuar" advances to confirming step
- [ ] Confirming step shows the recipient email and shortCode, "⚠ Essa ação não pode ser desfeita."
- [ ] "Voltar" returns to idle with field preserved
- [ ] On a non-VALID ticket, the "Transferir" button is not rendered

- [ ] **Step 4: Commit**

```bash
git add src/app/\(app\)/meus-ingressos/\[id\]/page.tsx
git commit -m "feat(transfer): wire TransferTicketDialog into ticket detail page"
```

---

## Self-Review

**Spec coverage:**
- ✓ `TransferTicketDialog` props: `ticketId`, `shortCode`, `sectorName`, `children`
- ✓ Smart field: email passthrough / CPF auto-format
- ✓ `idle` step: label, input, hint, validation errors, Cancel/Continuar
- ✓ `confirming` step: shortCode display, recipient display, warning, API error, Voltar/Transferir
- ✓ Button shown only for VALID tickets
- ✓ API call via `AXIOS_INSTANCE.post` to `/api/v1/tickets/:id/transfer`
- ✓ All 8 error cases mapped
- ✓ Success: close dialog → toast → `router.push('/meus-ingressos')`
- ✓ No new dependencies

**Placeholder scan:** No TBDs, all code blocks are complete.

**Type consistency:**
- `RecipientPayload` defined in Task 1, consumed by name in Task 2 ✓
- `formatCpfInput`, `formatCpfDisplay`, `validateRecipient`, `parseRecipient`, `mapApiError` — defined in Task 1, imported by exact name in Task 2 ✓
- `TransferTicketDialog` defined in Task 2, imported by exact name in Task 3 ✓

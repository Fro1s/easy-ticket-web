# Ticket Transfer — Design Spec

**Date:** 2026-06-25  
**Status:** Approved  

---

## Overview

Add a ticket transfer flow to the ticket detail page (`/meus-ingressos/[id]`). The owner of a valid ticket can transfer it to another Easy Ticket user identified by email or CPF. The backend endpoint `POST /api/v1/tickets/:id/transfer` is already implemented.

---

## Scope

- New component: `src/components/transfer-ticket-dialog.tsx`
- Modified file: `src/app/(app)/meus-ingressos/[id]/page.tsx` (replace disabled button)
- No new routes, no new dependencies

---

## Entry Point

The existing disabled button on the ticket detail page:

```tsx
// Before
<Button variant="ghost" size="sm" disabled>
  Transferir (em breve)
</Button>

// After
<TransferTicketDialog ticketId={ticket.id} shortCode={ticket.shortCode}>
  <Button variant="ghost" size="sm">
    Transferir
  </Button>
</TransferTicketDialog>
```

The button is only rendered when `ticket.status === 'VALID'`. If status is not VALID, the button stays hidden (handled by existing conditional rendering on the page).

---

## Component: `TransferTicketDialog`

**Props:**
```ts
interface TransferTicketDialogProps {
  ticketId: string
  shortCode: string        // shown in dialog header for context (e.g. "ET-XXXXXXXXX")
  sectorName: string       // shown in dialog header subtitle
  children: React.ReactNode  // the trigger element
}
```

**Internal state:**
```ts
type Step = 'idle' | 'confirming'

state: {
  step: Step
  recipient: string        // raw input value
  error: string | null     // field validation or API error
  isPending: boolean
}
```

---

## Smart Field Logic

Single `<Input>` with label `"Email ou CPF"` and hint `"Digite o email ou CPF cadastrado no Easy Ticket"`.

**Detection:**
- Contains `@` → treat as email, no mask
- Only digits (up to 11 chars) → treat as CPF, apply `react-imask` mask `000.000.000-00`

**Parsing on submit:**
```ts
function parseRecipient(value: string): { email: string } | { cpf: string } | null
```
- Returns `{ email }` if valid email format
- Returns `{ cpf }` of 11 normalized digits if valid CPF (format + verifier check)
- Returns `null` if invalid

---

## Dialog Steps

### Step `idle`

**Header:** "Transferir ingresso"  
**Subheader:** `{shortCode} · {sectorName}`

**Body:**
- Label: "Email ou CPF"
- Input with smart mask + `aria-invalid` on error
- Error message below input (validation only)
- Hint: "Digite o email ou CPF cadastrado no Easy Ticket"

**Footer:**
- `[Cancelar]` — closes dialog, resets state (`variant="outline"`)
- `[Continuar]` — validates field, advances to `confirming` if valid (`variant="primary"`)

### Step `confirming`

**Header:** "Confirmar transferência"

**Body:**
- "Você está transferindo **{shortCode}** para:"
- Recipient display: email as-is, or CPF formatted as `000.000.000-00`
- Warning line: "⚠ Essa ação não pode ser desfeita."
- API error message in red below warning (replaces previous error on retry)

**Footer:**
- `[Voltar]` — returns to `idle`, preserves field value, clears API error (`variant="outline"`)
- `[Transferir →]` — fires mutation, shows spinner while `isPending` (`variant="primary"`)

---

## API Integration

No generated hook exists yet. Call via `customInstance` from `src/lib/api.ts` directly:

```ts
import { customInstance } from '@/lib/api'

async function transferTicket(
  ticketId: string,
  body: { email: string } | { cpf: string }
): Promise<{ id: string; shortCode: string; status: string; recipientEmail: string }> {
  return customInstance({
    url: `/api/v1/tickets/${ticketId}/transfer`,
    method: 'POST',
    data: body,
  })
}
```

Wrapped in a TanStack `useMutation` inside the component.

---

## Error Handling

| Scenario | Where shown | Message |
|---|---|---|
| Empty field | Below input (`idle`) | "Informe o email ou CPF do destinatário" |
| Invalid email format | Below input (`idle`) | "Email inválido" |
| Incomplete CPF | Below input (`idle`) | "CPF incompleto" |
| Invalid CPF digits | Below input (`idle`) | "CPF inválido" |
| 404 from API | In dialog body (`confirming`) | "Essa pessoa não tem conta no Easy Ticket." |
| 400 — self transfer | In dialog body (`confirming`) | "Você não pode transferir um ingresso para si mesmo." |
| 400 — invalid status | In dialog body (`confirming`) | "Este ingresso não pode ser transferido." |
| 403 | In dialog body (`confirming`) | "Este ingresso não pertence à sua conta." |
| 5xx / network | In dialog body (`confirming`) | "Erro inesperado. Tente novamente." |

---

## Success Flow

On 201 response:
1. Dialog closes (controlled open state set to `false`)
2. `toast.success("Ingresso transferido com sucesso!")` via sonner
3. `router.push('/meus-ingressos')` — the ticket is already filtered out server-side (status `TRANSFERRED`)

No manual query invalidation needed since we navigate away.

---

## Out of Scope

- Showing transfer history (`/meus-ingressos?status=TRANSFERRED`)
- Transfer from the ticket list page
- Running `pnpm generate:api` for a typed hook (manual `customInstance` call is sufficient and consistent with how the codebase handles mutations before codegen)

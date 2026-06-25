'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { useMutation, useQueryClient } from '@tanstack/react-query'
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
    `/api/v1/tickets/${encodeURIComponent(ticketId)}/transfer`,
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
  const queryClient = useQueryClient()
  const [open, setOpen] = React.useState(false)
  const [step, setStep] = React.useState<Step>('idle')
  const [recipient, setRecipient] = React.useState('')
  const [fieldError, setFieldError] = React.useState<string | null>(null)
  const [apiError, setApiError] = React.useState<string | null>(null)

  const mutation = useMutation({
    mutationFn: () => {
      const payload = parseRecipient(recipient)
      if (!payload) throw new Error('Invalid recipient')
      return callTransferApi(ticketId, payload)
    },
    onSuccess: () => {
      setOpen(false)
      void queryClient.invalidateQueries({ queryKey: ['/api/v1/me/tickets'] })
      toast.success('Ingresso transferido com sucesso!')
      router.push('/meus-ingressos')
    },
    onError: (error) => {
      setApiError(mapApiError(error))
    },
  })

  function reset() {
    setStep('idle')
    setRecipient('')
    setFieldError(null)
    setApiError(null)
    mutation.reset()
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
              {apiError && (
                <p
                  className={
                    apiError === 'Essa pessoa não tem conta no Easy Ticket.'
                      ? 'text-[13px] font-bold text-destructive bg-destructive/10 border border-destructive/30 rounded-[6px] px-3 py-2'
                      : 'text-[12px] text-destructive'
                  }
                >
                  {apiError}
                </p>
              )}
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

export default TransferTicketDialog

'use client';

import * as React from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { QRCodeSVG } from 'qrcode.react';
import { isAxiosError } from 'axios';
import { SiteHeader } from '@/components/site-header';
import { Button } from '@/components/ui/button';
import { RequireAuth } from '@/components/require-auth';
import {
  useOrdersControllerFindOne,
  useOrdersControllerCheckout,
  useOrdersControllerSimulatePayment,
  OrderPaymentInfoMethod,
  type OrderResponse,
} from '@/generated/api';
import { formatBRLFromCents, formatEventDate, formatTime } from '@/lib/format';
import { useOrderStream } from '@/lib/use-order-stream';
import { cn } from '@/lib/utils';

type Method = keyof typeof OrderPaymentInfoMethod;

const METHODS: {
  id: Method;
  label: string;
  sub: string;
  badge?: string;
}[] = [
  { id: 'PIX', label: 'Pix', sub: 'na hora' },
  { id: 'CARD', label: 'Cartão', sub: 'até 10× sem juros' },
];

export default function CheckoutPage() {
  return (
    <div className="min-h-screen">
      <RequireAuth>{() => <CheckoutContent />}</RequireAuth>
    </div>
  );
}

function CheckoutContent() {
  const { orderId } = useParams<{ orderId: string }>();
  const router = useRouter();

  const orderQuery = useOrdersControllerFindOne(orderId);
  const checkoutMut = useOrdersControllerCheckout();
  const simulateMut = useOrdersControllerSimulatePayment();

  const order = orderQuery.data?.data;

  const [method, setMethod] = React.useState<Method>('PIX');
  const [error, setError] = React.useState<string | null>(null);

  // Live status updates via SSE — server pushes when producer/webhook flips
  // status to PAID/EXPIRED, the hook invalidates React Query and the redirect
  // effect below picks it up.
  const isTerminal = order?.status === 'PAID' || order?.status === 'EXPIRED' || order?.status === 'CANCELLED';
  useOrderStream(orderId, !isTerminal);

  // Auto-redirect if already paid
  React.useEffect(() => {
    if (order?.status === 'PAID') {
      router.replace(`/checkout/sucesso/${orderId}`);
    }
  }, [order, orderId, router]);

  // Countdown to reservedUntil (or payment expiry if checkout started)
  const deadline = order
    ? new Date(order.payment?.expiresAt ?? order.reservedUntil).getTime()
    : null;
  const [now, setNow] = React.useState(() => Date.now());
  React.useEffect(() => {
    if (!deadline) return;
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [deadline]);
  const secondsLeft = deadline ? Math.max(0, Math.floor((deadline - now) / 1000)) : 0;
  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, '0');
  const ss = String(secondsLeft % 60).padStart(2, '0');

  if (orderQuery.isLoading) {
    return (
      <>
        <CheckoutNav />
        <div className="max-w-[1280px] mx-auto px-6 md:px-16 py-16">
          <div className="h-[600px] bg-card border border-border rounded-[20px] animate-pulse" />
        </div>
      </>
    );
  }

  if (orderQuery.isError || !order) {
    return (
      <>
        <CheckoutNav />
        <div className="max-w-[600px] mx-auto px-6 py-24 text-center">
          <div className="font-display text-3xl font-bold mb-3">Pedido não encontrado</div>
          <p className="text-ink-muted mb-8">
            Esse pedido pode ter expirado ou o link está errado.
          </p>
          <Link href="/eventos">
            <Button variant="accent">Ver eventos</Button>
          </Link>
        </div>
      </>
    );
  }

  if (order.status === 'EXPIRED' || order.status === 'CANCELLED') {
    return (
      <>
        <CheckoutNav />
        <div className="max-w-[600px] mx-auto px-6 py-24 text-center">
          <div className="font-display text-3xl font-bold mb-3">Reserva expirada</div>
          <p className="text-ink-muted mb-8">
            A janela de 10 minutos acabou. Mas relaxa — é só voltar e escolher de novo.
          </p>
          <Link href={`/eventos/${order.event.slug}`}>
            <Button variant="accent">Voltar ao evento</Button>
          </Link>
        </div>
      </>
    );
  }

  const finalTotal = order.totalCents;
  const checkoutStarted = Boolean(order.payment);
  const timeUp = secondsLeft <= 0;
  const isManualPix = order.payment?.provider === 'MANUAL_PIX';

  async function handleConfirm() {
    setError(null);
    try {
      await checkoutMut.mutateAsync({ id: orderId, data: { method } });
      // refetch to get the payment info
      await orderQuery.refetch();
    } catch (err: unknown) {
      if (isAxiosError(err)) {
        const data = err.response?.data as { message?: string } | undefined;
        setError(data?.message ?? 'Não foi possível iniciar o pagamento.');
      } else {
        setError('Erro inesperado. Tente novamente.');
      }
    }
  }

  async function handleSimulate() {
    setError(null);
    try {
      await simulateMut.mutateAsync({ id: orderId });
      router.push(`/checkout/sucesso/${orderId}`);
    } catch (err: unknown) {
      if (isAxiosError(err)) {
        const data = err.response?.data as { message?: string } | undefined;
        setError(data?.message ?? 'Falha ao confirmar pagamento.');
      } else {
        setError('Erro inesperado.');
      }
    }
  }

  return (
    <>
      <CheckoutNav
        step="payment"
        countdown={checkoutStarted && !timeUp ? `${mm}:${ss}` : null}
      />

      <section className="px-6 md:px-16 py-8 md:py-12 max-w-[1280px] mx-auto grid lg:grid-cols-[minmax(0,1fr)_420px] gap-8 lg:gap-10">
        {/* LEFT — method + payment */}
        <div className="min-w-0">
          <h1 className="font-display text-[32px] md:text-[44px] font-extrabold tracking-[-1.5px] leading-none mb-1.5">
            Finalizar compra
          </h1>
          <p className="text-ink-muted text-[15px] mb-8">
            Seu ingresso chega no app em segundos.
          </p>

          {/* Method picker */}
          <div className="bg-card border border-border rounded-[18px] p-6 md:p-7 mb-5">
            <h2 className="font-display text-[20px] font-bold tracking-[-0.3px] mb-4">
              Forma de pagamento
            </h2>
            <div className="grid grid-cols-2 gap-2.5">
              {METHODS.map((m) => {
                const active = method === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setMethod(m.id)}
                    disabled={checkoutStarted}
                    className={cn(
                      'relative text-left p-3.5 rounded-xl border-[1.5px] transition-colors bg-transparent',
                      active
                        ? 'border-accent bg-accent/[0.06]'
                        : 'border-border hover:border-foreground',
                      checkoutStarted && !active && 'opacity-40 cursor-not-allowed'
                    )}
                  >
                    {m.badge ? (
                      <span className="absolute -top-2 right-2.5 bg-[var(--accent-2)] text-white font-mono font-bold text-[10px] px-2 py-0.5 rounded-full">
                        {m.badge}
                      </span>
                    ) : null}
                    <div className="text-[15px] font-semibold">{m.label}</div>
                    <div className="text-[11px] text-ink-muted mt-1">{m.sub}</div>
                  </button>
                );
              })}
            </div>

            {!checkoutStarted ? (
              <>
                <Button
                  variant="accent"
                  size="lg"
                  full
                  onClick={handleConfirm}
                  disabled={checkoutMut.isPending}
                  className="mt-6"
                >
                  {checkoutMut.isPending ? 'Gerando…' : `Gerar ${METHODS.find((m) => m.id === method)?.label}`}
                </Button>
              </>
            ) : (
              <div className="mt-6">
                {order.payment?.method === 'PIX' && order.payment?.copyPaste ? (
                  <PixView
                    copyPaste={order.payment.copyPaste}
                    amountCents={finalTotal}
                  />
                ) : null}
                {order.payment?.method === 'CARD' ? <CardView /> : null}

                {isManualPix ? (
                  <div className="mt-5 p-4 rounded-[10px] border border-yellow-500/30 bg-yellow-500/[0.06]">
                    <div className="font-mono text-[10px] tracking-[1.5px] uppercase text-yellow-300 mb-1">
                      Aguardando confirmação
                    </div>
                    <div className="text-[13px] text-ink-muted">
                      Após pagar, o produtor confirma o recebimento e seu ingresso vai
                      pro seu e-mail.
                    </div>
                  </div>
                ) : null}

                {!isManualPix && (
                  <div className="mt-5">
                    <Button
                      variant="accent"
                      size="md"
                      full
                      onClick={handleSimulate}
                      disabled={simulateMut.isPending || timeUp}
                    >
                      {simulateMut.isPending
                        ? 'Confirmando…'
                        : timeUp
                          ? 'Expirado'
                          : 'Simular pagamento (dev)'}
                    </Button>
                  </div>
                )}
              </div>
            )}

            {error ? (
              <div className="mt-4 border-l-2 border-destructive bg-destructive/10 px-3 py-2 text-[13px] text-foreground">
                {error}
              </div>
            ) : null}
          </div>

          <div className="flex items-center gap-2.5 p-4 bg-accent/[0.06] border border-accent/30 rounded-xl text-[13px]">
            <InfoIcon className="w-5 h-5 text-accent shrink-0" />
            <div>
              <b className="text-accent">Transparência total:</b> a taxa aparece
              discriminada no seu recibo.
            </div>
          </div>
        </div>

        {/* RIGHT — summary */}
        <aside>
          <div className="lg:sticky lg:top-6">
            <OrderSummaryCard order={order} finalTotal={finalTotal} />
            <div className="flex gap-2 justify-center items-center mt-4 text-[11px] text-ink-muted font-mono">
              <CheckIcon className="w-3 h-3 text-[var(--success)]" />
              CERTIFICADO SSL · ANTIFRAUDE · LGPD
            </div>
          </div>
        </aside>
      </section>
    </>
  );
}

function CheckoutNav({
  step = 'payment',
  countdown,
}: {
  step?: 'tickets' | 'payment' | 'confirm';
  countdown?: string | null;
}) {
  return (
    <>
      <SiteHeader />
      <div className="border-b border-border bg-background">
        <div className="max-w-[1280px] mx-auto px-6 md:px-16 py-4 flex items-center gap-6 text-[12px] text-ink-muted font-mono overflow-x-auto">
          <Step n={1} label="Ingressos" state={step === 'tickets' ? 'active' : 'done'} />
          <Divider />
          <Step
            n={2}
            label="Pagamento"
            state={step === 'payment' ? 'active' : step === 'confirm' ? 'done' : 'idle'}
          />
          <Divider />
          <Step n={3} label="Confirmação" state={step === 'confirm' ? 'active' : 'idle'} />
          {countdown ? (
            <div className="ml-auto flex items-center gap-1.5 shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
              <span>
                Reserva em <span className="text-accent font-bold">{countdown}</span>
              </span>
            </div>
          ) : null}
        </div>
      </div>
    </>
  );
}

function Step({
  n,
  label,
  state,
}: {
  n: number;
  label: string;
  state: 'active' | 'done' | 'idle';
}) {
  return (
    <div
      className={cn(
        'flex items-center gap-2.5 shrink-0',
        state === 'active' && 'text-foreground',
        state === 'done' && 'text-accent',
        state === 'idle' && 'text-ink-muted'
      )}
    >
      <div
        className={cn(
          'w-6 h-6 rounded-full border-[1.5px] grid place-items-center text-[11px] font-bold',
          state === 'active' && 'border-accent bg-transparent text-foreground',
          state === 'done' && 'border-accent bg-accent text-accent-foreground',
          state === 'idle' && 'border-border bg-transparent'
        )}
      >
        {state === 'done' ? <CheckIcon className="w-3.5 h-3.5" /> : n}
      </div>
      <span className={cn(state === 'active' && 'font-semibold')}>{label}</span>
    </div>
  );
}

function Divider() {
  return <div className="w-8 h-px bg-border shrink-0" />;
}

function PixView({ copyPaste, amountCents }: { copyPaste: string; amountCents: number }) {
  const [copied, setCopied] = React.useState(false);
  function copy() {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      void navigator.clipboard.writeText(copyPaste).then(() => {
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1800);
      });
    }
  }

  return (
    <div className="p-5 bg-input border border-dashed border-border rounded-xl">
      <div className="flex flex-col sm:flex-row gap-5 items-center">
        <div className="bg-white p-3 rounded-[10px]">
          <QRCodeSVG
            value={copyPaste}
            size={160}
            level="M"
            marginSize={0}
            bgColor="#FFFFFF"
            fgColor="#0A0A0F"
          />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-display text-[18px] font-bold mb-1">
            Pague {formatBRLFromCents(amountCents)} via Pix
          </div>
          <div className="text-[13px] text-ink-muted mb-3 leading-[1.5]">
            Escaneie o QR com o app do seu banco ou copie o código abaixo. A confirmação chega em segundos.
          </div>
          <div className="flex flex-col bg-background border border-border rounded-[6px] overflow-hidden">
            <div className="px-3 py-2 text-[11px] font-mono break-all max-h-24 overflow-y-auto leading-[1.4]">
              {copyPaste}
            </div>
            <button
              type="button"
              onClick={copy}
              className="w-full px-3.5 py-2.5 bg-foreground text-background text-[11px] font-semibold uppercase tracking-wide border-t border-border"
            >
              {copied ? 'Copiado!' : 'Copiar código'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function CardView() {
  return (
    <div className="p-5 bg-input border border-dashed border-border rounded-xl text-[13px] text-ink-muted">
      Integração com cartão chega na Phase 4.5 via Abacate Pay. Por enquanto, use o botão{' '}
      <b className="text-foreground">Simular pagamento</b> pra testar o fluxo completo.
    </div>
  );
}

function OrderSummaryCard({
  order,
  finalTotal,
}: {
  order: OrderResponse;
  finalTotal: number;
}) {
  return (
    <div className="bg-card border border-border rounded-[18px] p-5">
      <div className="flex gap-3.5 pb-4 border-b border-dashed border-border">
        <div
          className="w-16 h-16 rounded-[12px] shrink-0"
          style={{ background: order.event.posterUrl || 'var(--bg-input)' }}
        />
        <div className="min-w-0 flex-1">
          <div className="font-mono text-[10px] text-accent tracking-[0.8px] mb-1">
            {formatEventDate(order.event.startsAt)} · {formatTime(order.event.startsAt)}
          </div>
          <div className="font-display text-[16px] font-bold tracking-[-0.3px] leading-[1.2] truncate">
            {order.event.title}
          </div>
          <div className="text-[11px] text-ink-muted mt-0.5 truncate">
            {order.event.venueName} · {order.event.venueCity}
          </div>
        </div>
      </div>

      <div className="py-4 flex flex-col gap-2.5 text-[14px]">
        {order.items.map((it) => (
          <div key={it.id} className="flex justify-between items-center">
            <div className="flex items-center gap-2 min-w-0">
              <span
                className="w-2 h-2 rounded-[2px] shrink-0"
                style={{ backgroundColor: it.sectorColorHex }}
              />
              <span className="truncate">
                {it.qty}× {it.sectorName}
              </span>
            </div>
            <span className="font-mono shrink-0">
              {formatBRLFromCents(it.priceCents * it.qty)}
            </span>
          </div>
        ))}

        <div className="flex justify-between text-ink-muted">
          <span className="flex items-center gap-1.5">
            Taxa easy·ticket{' '}
            <span className="font-mono text-[10px] px-1.5 py-0.5 rounded-[4px] bg-accent/10 text-accent">
              {order.subtotalCents > 0
                ? `${((order.feeCents / order.subtotalCents) * 100).toFixed(2).replace('.', ',')}%`
                : '0%'}
            </span>
          </span>
          <span className="text-accent font-mono">{formatBRLFromCents(order.feeCents)}</span>
        </div>

        {order.savingsCents > 0 ? (
          <div className="mt-2 p-3 rounded-[10px] bg-[var(--accent-2)]/[0.06] border border-dashed border-[var(--accent-2)]/30">
            <div className="text-[10px] text-ink-muted font-mono uppercase tracking-[0.5px] mb-1">
              Em concorrentes você pagaria
            </div>
            <div className="flex justify-between text-[13px]">
              <span className="text-ink-muted line-through font-mono">
                {formatBRLFromCents(order.competitorTotalCents)}
              </span>
              <span className="text-[var(--accent-2)] font-bold font-mono">
                Economiza {formatBRLFromCents(order.savingsCents)}
              </span>
            </div>
          </div>
        ) : null}
      </div>

      <div className="pt-4 border-t border-border flex justify-between items-baseline">
        <span className="text-sm">Total</span>
        <div className="text-right">
          <div className="font-display text-[28px] font-extrabold tracking-[-0.8px] leading-none">
            {formatBRLFromCents(finalTotal)}
          </div>
        </div>
      </div>
    </div>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M5 12l5 5 9-11"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function InfoIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M12 8h.01M12 11v5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

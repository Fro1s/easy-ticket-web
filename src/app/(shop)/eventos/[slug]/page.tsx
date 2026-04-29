'use client';

import * as React from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { Button } from '@/components/ui/button';
import { FeeBadge } from '@/components/ui/fee-badge';
import { isAxiosError } from 'axios';
import {
  useEventsControllerFindBySlug,
  useEventsControllerAvailability,
  useOrdersControllerCreate,
  type SectorResponse,
} from '@/generated/api';
import { getAccessToken } from '@/lib/auth';
import { formatBRLFromCents, formatEventDate, formatTime } from '@/lib/format';
import { cn } from '@/lib/utils';

const CATEGORY_LABEL: Record<string, string> = {
  SHOW: 'Shows',
  FESTIVAL: 'Festivais',
  BALADA: 'Baladas',
  INFANTIL: 'Infantil',
  TEATRO: 'Teatro',
};

export default function EventDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();

  const eventQuery = useEventsControllerFindBySlug(slug);
  const availabilityQuery = useEventsControllerAvailability(slug, {
    query: { refetchInterval: 30_000, enabled: Boolean(eventQuery.data) },
  });

  const event = eventQuery.data?.data;
  const availability = availabilityQuery.data?.data;

  const [sectorId, setSectorId] = React.useState<string | null>(null);
  const [qty, setQty] = React.useState(2);
  const [orderError, setOrderError] = React.useState<string | null>(null);
  const createOrder = useOrdersControllerCreate();

  React.useEffect(() => {
    if (!event || sectorId) return;
    const firstWithStock = event.sectors.find((s) => {
      const live = availability?.sectors.find((a) => a.id === s.id);
      const avail = live?.available ?? s.capacity - s.sold - s.reserved;
      return avail > 0;
    });
    setSectorId((firstWithStock ?? event.sectors[0])?.id ?? null);
  }, [event, availability, sectorId]);

  if (eventQuery.isLoading) {
    return (
      <div className="min-h-screen">
        <SiteHeader />
        <div className="max-w-[1440px] mx-auto px-6 md:px-16 py-16">
          <div className="aspect-[4/5] md:aspect-[21/9] rounded-[24px] bg-card border border-border animate-pulse mb-10" />
          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_420px] gap-10">
            <div className="h-[600px] bg-card border border-border rounded-[20px] animate-pulse" />
            <div className="h-[500px] bg-card border border-border rounded-[20px] animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (eventQuery.isError || !event) {
    return (
      <div className="min-h-screen">
        <SiteHeader />
        <div className="max-w-[800px] mx-auto px-6 py-24 text-center">
          <div className="font-display text-3xl font-bold mb-3">Evento não encontrado</div>
          <p className="text-ink-muted mb-8">
            Esse link pode ter expirado ou o evento foi removido.
          </p>
          <Link href="/eventos">
            <Button variant="accent">Ver outros eventos</Button>
          </Link>
        </div>
      </div>
    );
  }

  const selected = event.sectors.find((s) => s.id === sectorId) ?? event.sectors[0];
  const liveStock = getAvailability(selected, availability?.sectors);

  const maxQty = Math.min(6, Math.max(1, liveStock));
  const safeQty = Math.min(qty, maxQty);

  const unit = selected.priceCents / 100;
  const subtotal = unit * safeQty;
  const feeRate = event.platformFeeRate ?? 0;
  const fee = unit * feeRate * safeQty;
  const competitorFee = unit * 0.2 * safeQty;
  const total = subtotal + fee;
  const installment = total / 10;
  const feePctLabel = (feeRate * 100).toFixed(2).replace(/[.,]?0+$/, '').replace('.', ',');

  async function goToCheckout() {
    setOrderError(null);
    if (!getAccessToken()) {
      const next = encodeURIComponent(`/eventos/${event!.slug}`);
      router.push(`/entrar?next=${next}`);
      return;
    }
    try {
      const res = await createOrder.mutateAsync({
        data: {
          eventSlug: event!.slug,
          items: [{ sectorId: selected.id, qty: safeQty }],
        },
      });
      router.push(`/checkout/${res.data.id}`);
    } catch (err: unknown) {
      if (isAxiosError(err)) {
        const status = err.response?.status;
        const data = err.response?.data as { message?: string | string[] } | undefined;
        const message = Array.isArray(data?.message) ? data.message.join(', ') : data?.message;
        if (status === 409) {
          setOrderError(message ?? 'Esse setor acabou de esgotar. Escolha outro.');
        } else if (status === 401) {
          const next = encodeURIComponent(`/eventos/${event!.slug}`);
          router.push(`/entrar?next=${next}`);
        } else {
          setOrderError(message ?? 'Não foi possível iniciar a compra agora.');
        }
      } else {
        setOrderError('Não foi possível iniciar a compra agora.');
      }
    }
  }

  return (
    <div className="min-h-screen">
      <SiteHeader />

      {/* Breadcrumb */}
      <div className="max-w-[1440px] mx-auto px-6 md:px-16 pt-6 pb-2 text-[13px] text-ink-muted flex items-center gap-2">
        <Link href="/eventos" className="hover:text-foreground flex items-center gap-1.5 transition-colors">
          <ChevIcon className="w-3 h-3 rotate-180" /> Voltar
        </Link>
        <span className="text-ink-dim mx-1">/</span>
        <span>{CATEGORY_LABEL[event.category] ?? event.category}</span>
        <span className="text-ink-dim mx-1">/</span>
        <span className="text-foreground truncate">{event.artist}</span>
      </div>

      {/* POSTER HERO */}
      <section className="max-w-[1440px] mx-auto px-6 md:px-16 pt-6">
        <div
          className="relative rounded-[24px] md:rounded-[28px] overflow-hidden aspect-[4/5] sm:aspect-[16/10] md:aspect-[21/9] border border-border"
          style={{ background: event.posterUrl }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-black/10 to-black/85" />
          <div className="absolute bottom-0 left-0 right-0 p-6 md:p-12">
            <div className="font-mono text-[12px] text-accent tracking-[1.2px] mb-4 uppercase">
              {formatEventDate(event.startsAt)} · {formatTime(event.startsAt)} ·{' '}
              {event.venue.name.toUpperCase()}
            </div>
            <h1 className="font-display text-[40px] sm:text-[56px] md:text-[92px] lg:text-[110px] font-extrabold tracking-[-2px] md:tracking-[-4px] leading-[0.9] text-white break-words">
              {event.artist}
            </h1>
            <div className="font-display text-[18px] md:text-[28px] font-medium italic text-white/70 mt-2">
              {event.title}
            </div>
          </div>
        </div>
      </section>

      {/* MAIN */}
      <section className="max-w-[1440px] mx-auto px-6 md:px-16 py-12 grid lg:grid-cols-[1fr_420px] gap-10">
        {/* LEFT */}
        <div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
            <InfoCard icon={<CalIcon />} label="Data" value={formatEventDate(event.startsAt)} />
            <InfoCard icon={<TicketIcon />} label="Abertura" value={formatTime(event.doorsAt)} />
            <InfoCard icon={<PinIcon />} label="Local" value={event.venue.name} />
            <InfoCard
              icon={<InfoIconSvg />}
              label="Idade"
              value={event.ageRating > 0 ? `${event.ageRating}+` : 'Livre'}
            />
          </div>

          <div className="bg-card border border-border rounded-[20px] p-6 md:p-7 mb-6">
            <div className="flex items-center justify-between mb-5 gap-3">
              <h3 className="font-display text-[22px] font-bold tracking-[-0.4px]">
                Escolha seu setor
              </h3>
              <span className="text-xs text-ink-muted font-mono">
                {event.venue.name.toUpperCase()} · {event.venue.capacity.toLocaleString('pt-BR')} LUGARES
              </span>
            </div>

            <div className="flex flex-col gap-2">
              {event.sectors.map((sector) => {
                const avail = getAvailability(sector, availability?.sectors);
                const soldOut = avail <= 0;
                const isSelected = sector.id === selected.id;
                return (
                  <button
                    key={sector.id}
                    type="button"
                    onClick={() => !soldOut && setSectorId(sector.id)}
                    disabled={soldOut}
                    className={cn(
                      'flex items-center gap-3.5 px-4 py-3.5 rounded-xl border text-left transition-colors',
                      isSelected
                        ? 'border-accent bg-accent/[0.08]'
                        : 'border-border bg-transparent hover:border-foreground',
                      soldOut && 'opacity-40 cursor-not-allowed hover:border-border'
                    )}
                  >
                    <div
                      className="w-3 h-3 rounded-[3px] shrink-0"
                      style={{ backgroundColor: sector.colorHex }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-[15px] font-semibold truncate">{sector.name}</div>
                      <div className="text-[11px] text-ink-muted font-mono mt-0.5">
                        {soldOut ? 'ESGOTADO' : `${avail.toLocaleString('pt-BR')} disponíveis`}
                      </div>
                    </div>
                    <div className="font-display text-[20px] font-bold tracking-[-0.4px]">
                      {formatBRLFromCents(sector.priceCents)}
                    </div>
                    <div
                      className={cn(
                        'w-5 h-5 rounded-full border-2 grid place-items-center shrink-0',
                        isSelected ? 'border-accent' : 'border-border'
                      )}
                    >
                      {isSelected ? <div className="w-2 h-2 rounded-full bg-accent" /> : null}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="bg-card border border-border rounded-[20px] p-6 md:p-7">
            <h3 className="font-display text-[22px] font-bold tracking-[-0.4px] mb-3">
              Sobre o evento
            </h3>
            <p className="text-[15px] text-ink-muted leading-[1.6] whitespace-pre-line">
              {event.description}
            </p>
          </div>
        </div>

        {/* RIGHT — sticky summary */}
        <aside>
          <div className="lg:sticky lg:top-6 bg-card border border-border rounded-[20px] p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs text-ink-muted font-mono tracking-[0.5px] uppercase">
                Seu pedido
              </span>
              {feeRate > 0 ? (
                <FeeBadge fee={unit * feeRate} competitor={unit * 0.2} size="sm" />
              ) : (
                <span className="font-mono text-[10px] tracking-[1px] uppercase px-2 py-1 rounded-full bg-accent/10 text-accent">
                  Sem taxa
                </span>
              )}
            </div>

            <div className="py-4 border-b border-dashed border-border">
              <div className="text-[13px] text-ink-muted mb-1">Setor selecionado</div>
              <div className="flex items-center gap-2">
                <div
                  className="w-2.5 h-2.5 rounded-[2px]"
                  style={{ backgroundColor: selected.colorHex }}
                />
                <span className="font-display text-[20px] font-bold">{selected.name}</span>
              </div>
            </div>

            <div className="py-5 border-b border-dashed border-border">
              <div className="flex items-center justify-between">
                <span className="text-sm">Quantidade</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setQty((q) => Math.max(1, q - 1))}
                    disabled={safeQty <= 1}
                    className="w-8 h-8 rounded-full border border-border text-foreground grid place-items-center hover:border-foreground disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <MinusIcon className="w-3.5 h-3.5" />
                  </button>
                  <span className="w-8 text-center font-display text-[18px] font-bold">
                    {safeQty}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQty((q) => Math.min(maxQty, q + 1))}
                    disabled={safeQty >= maxQty}
                    className="w-8 h-8 rounded-full bg-accent text-accent-foreground grid place-items-center disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <PlusIcon className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              {liveStock > 0 && liveStock <= 10 ? (
                <div className="text-[11px] text-accent-2 font-mono mt-2 tracking-[0.5px]">
                  Restam apenas {liveStock} nesse setor
                </div>
              ) : null}
            </div>

            <div className="py-4 flex flex-col gap-2 text-sm">
              <div className="flex justify-between text-ink-muted">
                <span>
                  {safeQty}× {formatBRLFromCents(selected.priceCents)}
                </span>
                <span className="text-foreground">{formatBRLFromCents(subtotal * 100)}</span>
              </div>
              <div className="flex justify-between text-ink-muted">
                <span>Taxa{feeRate > 0 ? ` · ${feePctLabel}%` : ''}</span>
                <span className="text-accent">{formatBRLFromCents(fee * 100)}</span>
              </div>
              {feeRate > 0 ? (
                <div className="flex justify-between text-ink-dim text-xs">
                  <span>Taxa concorrentes</span>
                  <span className="line-through">{formatBRLFromCents(competitorFee * 100)}</span>
                </div>
              ) : null}
            </div>

            <div className="py-4 border-t border-border flex justify-between items-baseline mb-4">
              <span className="text-sm">Total</span>
              <span className="font-display text-[28px] font-extrabold tracking-[-0.8px]">
                {formatBRLFromCents(total * 100)}
              </span>
            </div>
            <div className="text-[11px] text-ink-muted font-mono mb-4 text-center">
              ou 10× {formatBRLFromCents(installment * 100)} sem juros
            </div>

            <Button
              variant="accent"
              size="lg"
              full
              onClick={goToCheckout}
              disabled={liveStock <= 0 || createOrder.isPending}
            >
              {liveStock <= 0
                ? 'Esgotado'
                : createOrder.isPending
                  ? 'Reservando…'
                  : 'Ir para pagamento →'}
            </Button>

            {orderError ? (
              <div className="mt-3 border-l-2 border-destructive bg-destructive/10 px-3 py-2 text-[12px] text-foreground">
                {orderError}
              </div>
            ) : null}

            <div className="flex items-center gap-2 justify-center mt-3.5 text-[11px] text-ink-muted font-mono tracking-[0.4px]">
              <CheckIcon className="w-3 h-3 text-[var(--success)]" />
              COMPRA 100% SEGURA · ANTIFRAUDE
            </div>
          </div>
        </aside>
      </section>

      <SiteFooter />
    </div>
  );
}

function getAvailability(
  sector: SectorResponse,
  live: { id: string; available: number }[] | undefined
) {
  const match = live?.find((a) => a.id === sector.id);
  if (match) return match.available;
  return Math.max(0, sector.capacity - sector.sold - sector.reserved);
}

function InfoCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="bg-card border border-border rounded-[14px] p-3.5">
      <div className="flex items-center gap-1.5 text-[11px] text-ink-muted font-mono mb-1.5 tracking-[0.5px] uppercase">
        <span className="w-3 h-3 shrink-0 grid place-items-center">{icon}</span>
        {label}
      </div>
      <div className="text-[15px] font-semibold truncate">{value}</div>
    </div>
  );
}

function CalIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="w-3 h-3">
      <rect x="3" y="5" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="1.8" />
      <path d="M3 9h18M8 3v4M16 3v4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}
function TicketIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="w-3 h-3">
      <path
        d="M3 9a2 2 0 012-2h14a2 2 0 012 2v2a2 2 0 000 4v2a2 2 0 01-2 2H5a2 2 0 01-2-2v-2a2 2 0 000-4V9z"
        stroke="currentColor"
        strokeWidth="1.8"
      />
    </svg>
  );
}
function PinIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="w-3 h-3">
      <path
        d="M12 21s-7-6.5-7-12a7 7 0 0114 0c0 5.5-7 12-7 12z"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <circle cx="12" cy="9" r="2.5" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}
function InfoIconSvg() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="w-3 h-3">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
      <path d="M12 8h.01M12 11v5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}
function MinusIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
function PlusIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
function CheckIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M5 12l5 5 9-11"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
function ChevIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M9 6l6 6-6 6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

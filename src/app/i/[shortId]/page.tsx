'use client';

import * as React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { isAxiosError } from 'axios';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { Button } from '@/components/ui/button';
import { useTicketsControllerShare, type SharedTicketResponse } from '@/generated/api';
import { formatEventDate, formatTime } from '@/lib/format';
import { cn } from '@/lib/utils';

const STATUS_LABEL: Record<string, { label: string; tone: 'ok' | 'mute' }> = {
  VALID: { label: 'Confirmado', tone: 'ok' },
  USED: { label: 'Já utilizado', tone: 'mute' },
  TRANSFERRED: { label: 'Transferido', tone: 'mute' },
  REFUNDED: { label: 'Reembolsado', tone: 'mute' },
};

export default function SharedTicketPage() {
  const { shortId } = useParams<{ shortId: string }>();
  const code = (shortId ?? '').toUpperCase();
  const query = useTicketsControllerShare(code, {
    query: { enabled: Boolean(code), retry: false },
  });

  const ticket = query.data?.data;
  const notFound =
    isAxiosError(query.error) && query.error.response?.status === 404;

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="flex-1">
        {query.isLoading ? (
          <div className="max-w-[860px] mx-auto px-6 md:px-16 py-16">
            <div className="h-[480px] bg-card border border-border rounded-[24px] animate-pulse" />
          </div>
        ) : notFound || !ticket ? (
          <NotFoundState />
        ) : (
          <SharedView ticket={ticket} />
        )}
      </main>
      <SiteFooter />
    </div>
  );
}

function NotFoundState() {
  return (
    <div className="max-w-[600px] mx-auto px-6 py-24 text-center">
      <div className="font-mono text-[11px] text-ink-muted tracking-[1.5px] uppercase mb-3">
        Ingresso compartilhado
      </div>
      <div className="font-display text-3xl md:text-4xl font-bold tracking-[-0.5px] mb-3">
        Esse ingresso não existe
      </div>
      <p className="text-ink-muted mb-8">
        O código pode ter sido digitado errado, ou o ingresso foi
        cancelado/reembolsado. Que tal explorar shows abertos?
      </p>
      <Link href="/eventos">
        <Button variant="accent">Ver eventos abertos</Button>
      </Link>
    </div>
  );
}

function SharedView({ ticket }: { ticket: SharedTicketResponse }) {
  const status = STATUS_LABEL[ticket.status] ?? { label: ticket.status, tone: 'mute' as const };

  return (
    <div className="max-w-[860px] mx-auto px-6 md:px-16 py-10 md:py-14">
      <div className="font-mono text-[11px] text-accent tracking-[1.5px] uppercase mb-5">
        {ticket.holderFirstName ? `${ticket.holderFirstName} vai. ` : ''}Você quer ir junto?
      </div>

      <div className="relative bg-card border border-border rounded-[24px] overflow-hidden">
        <div
          className="relative aspect-[16/9] md:aspect-[21/9]"
          style={{ background: ticket.event.posterUrl || 'var(--bg-input)' }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-black/10" />
          <div className="absolute top-5 left-5 right-5 flex justify-between items-start gap-3">
            <div className="px-3 py-1.5 rounded-full bg-black/55 backdrop-blur-md text-[11px] font-mono font-semibold tracking-[0.6px] uppercase text-white">
              № {ticket.shortCode}
            </div>
            <div
              className={cn(
                'text-[10px] font-mono uppercase tracking-[1px] px-2.5 py-1 rounded-full border backdrop-blur-md',
                status.tone === 'ok' && 'border-accent/60 text-accent bg-accent/15',
                status.tone === 'mute' && 'border-white/30 text-white/70 bg-black/40'
              )}
            >
              {status.label}
            </div>
          </div>
          <div className="absolute bottom-5 left-5 right-5 text-white">
            <div className="font-mono text-[11px] text-accent tracking-[1px] mb-2">
              {formatEventDate(ticket.event.startsAt)} · {formatTime(ticket.event.startsAt)} ·{' '}
              {ticket.event.venueName.toUpperCase()}
            </div>
            <div className="font-display text-[28px] md:text-[44px] font-extrabold tracking-[-1.5px] leading-[0.95]">
              {ticket.event.artist}
            </div>
            <div className="font-display text-[16px] md:text-[20px] italic font-medium text-white/70 mt-1">
              {ticket.event.title}
            </div>
          </div>
        </div>

        <div className="relative h-6 flex items-center">
          <div className="absolute -left-3 top-0 w-6 h-6 rounded-full bg-background border border-border" />
          <div className="absolute -right-3 top-0 w-6 h-6 rounded-full bg-background border border-border" />
          <div className="flex-1 mx-8 border-t border-dashed border-border" />
        </div>

        <div className="p-6 md:p-10 grid md:grid-cols-2 gap-6 md:gap-10">
          <DataBlock label="Setor">
            <div className="flex items-center gap-2">
              <span
                className="inline-block w-3 h-3 rounded-[3px]"
                style={{ backgroundColor: ticket.sector.colorHex }}
              />
              <span className="font-display text-[20px] font-bold tracking-[-0.4px]">
                {ticket.sector.name}
              </span>
            </div>
          </DataBlock>

          <DataBlock label="Local">
            {ticket.event.venueName}
            <div className="text-[12px] text-ink-muted font-mono mt-0.5">
              {ticket.event.venueCity}, {ticket.event.venueState}
            </div>
          </DataBlock>

          <DataBlock label="Data e abertura">
            {formatEventDate(ticket.event.startsAt)} · {formatTime(ticket.event.startsAt)}
            <div className="text-[12px] text-ink-muted font-mono mt-0.5">
              Portões abrem {formatTime(ticket.event.doorsAt)}
            </div>
          </DataBlock>

          <DataBlock label="Quem vai">
            {ticket.holderFirstName || '—'}
            <div className="text-[12px] text-ink-muted font-mono mt-0.5">
              Cód. {ticket.shortCode}
            </div>
          </DataBlock>
        </div>

        <div className="border-t border-border p-6 md:p-10 bg-bg-subtle/40">
          <div className="font-mono text-[11px] text-ink-muted tracking-[1.5px] uppercase mb-2">
            Você também pode ir
          </div>
          <div className="font-display text-[22px] md:text-[28px] font-bold tracking-[-0.6px] mb-1">
            Compre seu ingresso com taxa de 2,5%.
          </div>
          <p className="text-[14px] text-ink-muted mb-5 max-w-[520px]">
            Sem taxa escondida, sem surpresa no checkout. A diferença que outras
            plataformas cobram, a gente devolve em transparência.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href={`/eventos/${ticket.event.slug}`}>
              <Button variant="accent">Ver setores e comprar</Button>
            </Link>
            <Link href="/manifesto">
              <Button variant="ghost">Por que 2,5%?</Button>
            </Link>
          </div>
        </div>
      </div>

      <p className="text-[11px] text-ink-dim font-mono text-center mt-5 tracking-[0.5px]">
        Esta é uma prévia pública. O QR de entrada fica apenas com{' '}
        {ticket.holderFirstName || 'a pessoa'}.
      </p>
    </div>
  );
}

function DataBlock({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="text-[11px] text-ink-muted uppercase tracking-[1px] font-mono mb-1">
        {label}
      </div>
      <div className="text-[15px] text-foreground">{children}</div>
    </div>
  );
}

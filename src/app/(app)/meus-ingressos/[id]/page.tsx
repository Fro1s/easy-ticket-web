'use client';

import * as React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { QRCodeSVG } from 'qrcode.react';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { Button } from '@/components/ui/button';
import { RequireAuth } from '@/components/require-auth';
import { isAxiosError } from 'axios';
import {
  useMeControllerTicket,
  type MyTicketItem,
} from '@/generated/api';
import { formatBRLFromCents, formatEventDate, formatTime } from '@/lib/format';
import { cn } from '@/lib/utils';

export default function TicketDetailPage() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <RequireAuth>{() => <TicketDetailContent />}</RequireAuth>
      <SiteFooter />
    </div>
  );
}

function TicketDetailContent() {
  const { id } = useParams<{ id: string }>();
  const ticketQuery = useMeControllerTicket(id, {
    query: { enabled: Boolean(id), retry: false },
  });
  const ticket = ticketQuery.data?.data;
  const notFound =
    isAxiosError(ticketQuery.error) && ticketQuery.error.response?.status === 404;

  if (ticketQuery.isLoading) {
    return (
      <div className="max-w-[900px] mx-auto px-6 md:px-16 py-16">
        <div className="h-[600px] bg-card border border-border rounded-[24px] animate-pulse" />
      </div>
    );
  }

  if (!ticket || notFound) {
    return (
      <div className="max-w-[600px] mx-auto px-6 py-24 text-center">
        <div className="font-display text-3xl font-bold mb-3">Ingresso não encontrado</div>
        <p className="text-ink-muted mb-8">
          Esse ingresso pode ter sido transferido ou removido.
        </p>
        <Link href="/meus-ingressos">
          <Button variant="accent">Ver meus ingressos</Button>
        </Link>
      </div>
    );
  }

  return <TicketView ticket={ticket} />;
}

const STATUS_LABEL: Record<string, { label: string; tone: 'ok' | 'mute' | 'warn' }> = {
  VALID: { label: 'Válido', tone: 'ok' },
  USED: { label: 'Já utilizado', tone: 'mute' },
  TRANSFERRED: { label: 'Transferido', tone: 'mute' },
  REFUNDED: { label: 'Reembolsado', tone: 'mute' },
};

function TicketView({ ticket }: { ticket: MyTicketItem }) {
  const status = STATUS_LABEL[ticket.status] ?? { label: ticket.status, tone: 'mute' as const };
  const isValid = ticket.status === 'VALID';

  return (
    <div className="max-w-[860px] mx-auto px-6 md:px-16 py-10 md:py-14">
      <Link
        href="/meus-ingressos"
        className="inline-flex items-center gap-1.5 text-[13px] text-ink-muted hover:text-foreground transition-colors mb-6"
      >
        <ChevIcon className="w-3 h-3 rotate-180" /> Voltar pra meus ingressos
      </Link>

      {/* Ticket "card" */}
      <div className="relative bg-card border border-border rounded-[24px] overflow-hidden">
        {/* poster header */}
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

        {/* perforation strip */}
        <div className="relative h-6 flex items-center">
          <div className="absolute -left-3 top-0 w-6 h-6 rounded-full bg-background border border-border" />
          <div className="absolute -right-3 top-0 w-6 h-6 rounded-full bg-background border border-border" />
          <div className="flex-1 mx-8 border-t border-dashed border-border" />
        </div>

        {/* body — QR + meta */}
        <div className="p-6 md:p-10 grid md:grid-cols-[260px_1fr] gap-8 md:gap-12">
          <div className="flex flex-col items-center gap-3">
            <div
              className={cn(
                'p-4 rounded-[12px] bg-white grid place-items-center',
                !isValid && 'opacity-40 grayscale'
              )}
            >
              <QRCodeSVG
                value={ticket.qrToken}
                size={200}
                level="M"
                marginSize={0}
                bgColor="#FFFFFF"
                fgColor="#0A0A0F"
              />
            </div>
            <div className="text-[11px] text-ink-muted font-mono tracking-[1px] text-center">
              MOSTRE NA PORTARIA
            </div>
            <div className="font-mono text-[13px] tracking-[2px] font-bold">
              {ticket.shortCode}
            </div>
          </div>

          <div className="flex flex-col gap-5">
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

            <DataBlock label="Pago">{formatBRLFromCents(ticket.sector.priceCents)}</DataBlock>

            {ticket.usedAt ? (
              <DataBlock label="Utilizado em">
                {new Date(ticket.usedAt).toLocaleString('pt-BR')}
              </DataBlock>
            ) : null}

            <div className="pt-4 border-t border-border flex flex-wrap gap-2">
              <Button variant="ghost" size="sm" disabled>
                Transferir (em breve)
              </Button>
              <Button variant="ghost" size="sm" disabled>
                Baixar PDF (em breve)
              </Button>
            </div>
          </div>
        </div>
      </div>

      <p className="text-[11px] text-ink-dim font-mono text-center mt-5 tracking-[0.5px]">
        Pedido {ticket.orderId} · Comprado em{' '}
        {new Date(ticket.createdAt).toLocaleDateString('pt-BR')}
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

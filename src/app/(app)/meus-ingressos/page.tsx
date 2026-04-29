'use client';

import * as React from 'react';
import Link from 'next/link';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { Button } from '@/components/ui/button';
import { RequireAuth } from '@/components/require-auth';
import {
  useMeControllerTickets,
  MyTicketItemStatus,
  type MyTicketItem,
} from '@/generated/api';
import { formatEventDate, formatTime } from '@/lib/format';
import { cn } from '@/lib/utils';

type StatusFilter = 'TODOS' | keyof typeof MyTicketItemStatus;

const STATUS_FILTERS: { key: StatusFilter; label: string }[] = [
  { key: 'TODOS', label: 'Todos' },
  { key: 'VALID', label: 'Válidos' },
  { key: 'USED', label: 'Usados' },
  { key: 'TRANSFERRED', label: 'Transferidos' },
  { key: 'REFUNDED', label: 'Reembolsados' },
];

export default function MeusIngressosPage() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <RequireAuth>{() => <TicketsContent />}</RequireAuth>
      <SiteFooter />
    </div>
  );
}

function TicketsContent() {
  const [filter, setFilter] = React.useState<StatusFilter>('TODOS');

  const ticketsQuery = useMeControllerTickets({
    page: 1,
    pageSize: 60,
    ...(filter !== 'TODOS' ? { status: filter } : {}),
  });

  const tickets = ticketsQuery.data?.data.items ?? [];

  return (
    <div className="max-w-[1280px] mx-auto px-6 md:px-16 py-12 md:py-16">
      <div className="font-mono text-[11px] tracking-[2px] uppercase text-accent mb-3">
        SUA COLEÇÃO
      </div>
      <h1 className="font-display text-[40px] md:text-[56px] font-bold tracking-[-1.8px] leading-[0.95] mb-2">
        Meus ingressos.
      </h1>
      <p className="text-ink-muted text-[15px] max-w-[520px]">
        Acesse o QR no dia do evento. Quer transferir pra alguém da galera?{' '}
        <span className="text-ink-dim">Em breve — Phase 5.</span>
      </p>

      <div className="flex gap-2.5 flex-wrap mt-8 mb-8">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => setFilter(f.key)}
            className={cn(
              'h-10 px-4 rounded-full border text-[13px] font-medium transition-colors',
              filter === f.key
                ? 'bg-accent text-accent-foreground border-accent'
                : 'bg-transparent text-foreground border-border hover:border-foreground'
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {ticketsQuery.isLoading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="aspect-[4/5] bg-card border border-border rounded-[20px] animate-pulse"
            />
          ))}
        </div>
      ) : tickets.length === 0 ? (
        <EmptyState filter={filter} />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {tickets.map((t) => (
            <TicketCardLink key={t.id} ticket={t} />
          ))}
        </div>
      )}
    </div>
  );
}

function EmptyState({ filter }: { filter: StatusFilter }) {
  return (
    <div className="border border-border bg-card rounded-[24px] p-12 md:p-16 text-center">
      <div className="font-display text-[28px] font-bold mb-2">
        {filter === 'TODOS'
          ? 'Você ainda não tem ingressos.'
          : 'Nenhum ingresso aqui.'}
      </div>
      <p className="text-ink-muted text-[15px] mb-7 max-w-[400px] mx-auto">
        {filter === 'TODOS'
          ? 'Bora começar pelo próximo show? A taxa cai na sua frente.'
          : 'Tente outro filtro.'}
      </p>
      <Link href="/eventos">
        <Button variant="accent">Ver eventos →</Button>
      </Link>
    </div>
  );
}

const STATUS_LABEL: Record<string, { label: string; tone: 'ok' | 'mute' | 'warn' }> = {
  VALID: { label: 'Válido', tone: 'ok' },
  USED: { label: 'Usado', tone: 'mute' },
  TRANSFERRED: { label: 'Transferido', tone: 'mute' },
  REFUNDED: { label: 'Reembolsado', tone: 'mute' },
};

function TicketCardLink({ ticket }: { ticket: MyTicketItem }) {
  const status = STATUS_LABEL[ticket.status] ?? { label: ticket.status, tone: 'mute' as const };
  const dimmed = ticket.status !== 'VALID';

  return (
    <Link
      href={`/meus-ingressos/${ticket.id}`}
      className={cn(
        'group bg-card border border-border rounded-[20px] overflow-hidden hover:border-accent transition-colors',
        dimmed && 'opacity-70'
      )}
    >
      <div
        className="relative aspect-[4/3]"
        style={{ background: ticket.event.posterUrl || 'var(--bg-input)' }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
        <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-[10px] font-mono font-semibold tracking-[0.5px] uppercase text-white">
          № {ticket.shortCode}
        </div>
        <div
          className={cn(
            'absolute top-3 right-3 text-[10px] font-mono uppercase tracking-[1px] px-2.5 py-1 rounded-full border backdrop-blur-md',
            status.tone === 'ok' && 'border-accent/50 text-accent bg-accent/10',
            status.tone === 'warn' && 'border-[var(--accent-2)]/40 text-[var(--accent-2)] bg-[var(--accent-2)]/10',
            status.tone === 'mute' && 'border-white/30 text-white/70 bg-black/40'
          )}
        >
          {status.label}
        </div>
        <div className="absolute bottom-3 left-3 right-3 text-white">
          <div className="font-mono text-[11px] tracking-[1px] mb-0.5">
            {formatEventDate(ticket.event.startsAt)} · {formatTime(ticket.event.startsAt)}
          </div>
          <div className="font-display text-[18px] font-bold leading-tight line-clamp-2">
            {ticket.event.title}
          </div>
        </div>
      </div>

      <div className="p-4 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[11px] text-ink-muted font-mono uppercase tracking-[0.8px]">
            Setor
          </div>
          <div className="flex items-center gap-1.5 text-[14px] font-semibold truncate">
            <span
              className="inline-block w-2 h-2 rounded-[2px] shrink-0"
              style={{ backgroundColor: ticket.sector.colorHex }}
            />
            {ticket.sector.name}
          </div>
        </div>
        <div className="text-[12px] text-ink-muted shrink-0 group-hover:text-accent transition-colors">
          Ver QR →
        </div>
      </div>
    </Link>
  );
}

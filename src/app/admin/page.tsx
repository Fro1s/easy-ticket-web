'use client';

import Link from 'next/link';
import { RoleGate } from '@/components/role-gate';
import { ProducerHeader } from '@/components/producer-header';
import { useProducerControllerDashboard } from '@/generated/api';
import { EVENT_STATUS_PT, PAYMENT_PROVIDER_PT, tr } from '@/lib/i18n';

const fmtBRL = (cents: number) =>
  (cents / 100).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });

const STATUS_PILL: Record<string, string> = {
  PUBLISHED: 'bg-accent/15 text-accent',
  DRAFT: 'bg-ink-dim/20 text-ink-dim',
  CANCELLED: 'bg-red-500/15 text-red-400',
};

function KpiCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div
      className={`border ${
        accent ? 'border-accent/60 bg-accent/5' : 'border-border/50 bg-card/40'
      } rounded-[6px] p-5`}
    >
      <div className="font-mono text-[10px] tracking-[1.5px] uppercase text-ink-dim mb-2">
        {label}
      </div>
      <div
        className={`font-display text-2xl font-bold ${
          accent ? 'text-accent' : ''
        }`}
      >
        {value}
      </div>
    </div>
  );
}

export default function AdminPage() {
  const { data, isLoading } = useProducerControllerDashboard();
  const dash = data?.data;

  return (
    <RoleGate allow={['ADMIN']}>
      {(user) => (
        <>
          <ProducerHeader scope="admin" />
          <main className="min-h-screen bg-ink-deep px-6 md:px-8 py-10 text-foreground">
            <div className="mx-auto max-w-6xl">
              <div className="font-mono text-[11px] tracking-[2px] uppercase text-accent mb-3">
                VISÃO TOTAL DA PLATAFORMA
              </div>
              <h1 className="font-display text-[48px] md:text-[56px] font-extrabold leading-[0.95] tracking-[-2px] mb-3">
                Olá, {user.name ?? user.email}
                <span className="text-accent">.</span>
              </h1>
              <p className="text-ink-dim mb-10">
                Você está vendo todos os eventos da plataforma — independente do produtor.
              </p>

            {isLoading ? (
              <div className="text-ink-dim">Carregando…</div>
            ) : dash ? (
              <>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-12">
                  <KpiCard label="Receita bruta total" value={fmtBRL(dash.totalGrossRevenueCents)} />
                  <KpiCard label="Taxa Easy Ticket" value={fmtBRL(dash.totalPlatformFeeCents)} accent />
                  <KpiCard label="Líquido aos produtores" value={fmtBRL(dash.totalNetCents)} />
                  <KpiCard label="Ingressos vendidos" value={String(dash.totalTicketsSold)} />
                </div>

                <h2 className="font-display text-2xl font-bold mb-5">
                  Todos os eventos ({dash.events.length})
                </h2>

                <ul className="space-y-3">
                  {dash.events.map((e) => (
                    <li key={e.id}>
                      <Link
                        href={`/painel-produtor/eventos/${e.slug}`}
                        className="block border border-border/50 rounded-[6px] p-5 bg-card/40 hover:border-accent/60 transition"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 mb-1 flex-wrap">
                              <span
                                className={`font-mono text-[10px] tracking-[1.5px] uppercase px-2 py-1 rounded-[3px] ${
                                  STATUS_PILL[e.status] ?? 'bg-ink-dim/20 text-ink-dim'
                                }`}
                              >
                                {tr(EVENT_STATUS_PT, e.status)}
                              </span>
                              {e.kpis.pendingManualOrdersCount > 0 && (
                                <span className="font-mono text-[10px] tracking-[1.5px] uppercase px-2 py-1 rounded-[3px] bg-yellow-500/15 text-yellow-300">
                                  {e.kpis.pendingManualOrdersCount} pendente(s)
                                </span>
                              )}
                              <span className="font-mono text-[10px] tracking-[1.5px] uppercase text-ink-dim">
                                {tr(PAYMENT_PROVIDER_PT, e.paymentProvider)}
                              </span>
                            </div>
                            <div className="font-display text-xl font-bold truncate">
                              {e.title}
                            </div>
                            <div className="text-sm text-ink-dim">
                              {e.artist} ·{' '}
                              {new Date(e.startsAt).toLocaleString('pt-BR')} ·{' '}
                              {e.venue.city}/{e.venue.state}
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <div className="font-mono text-[10px] tracking-[1.5px] uppercase text-ink-dim">
                              Vendidos
                            </div>
                            <div className="font-display text-2xl">
                              {e.kpis.ticketsSold}
                            </div>
                            <div className="font-mono text-[11px] text-accent mt-1">
                              {fmtBRL(e.kpis.netCents)}
                            </div>
                          </div>
                        </div>
                      </Link>
                    </li>
                  ))}
                  {dash.events.length === 0 && (
                    <li className="text-ink-dim border border-dashed border-border/50 rounded-[6px] p-8 text-center">
                      Nenhum evento na plataforma ainda.
                    </li>
                  )}
                </ul>
              </>
            ) : (
              <div className="text-red-400">Erro ao carregar dashboard.</div>
            )}
            </div>
          </main>
        </>
      )}
    </RoleGate>
  );
}
